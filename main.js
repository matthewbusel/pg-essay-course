import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Check if user is signed in
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'signin.html';
    }
    return user;
}

const user = await checkAuth();

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

async function fetchEssays() {
    console.log('Fetching essays...');
    try {
        // Fetch essays from Supabase
        const { data: essays, error: essaysError } = await supabase
            .from('essays')
            .select('*')
            .order('date', { ascending: true });

        if (essaysError) {
            console.error('Error fetching essays:', essaysError);
            return;
        }

        // Fetch user's read status for essays
        const { data: userStatus, error: statusError } = await supabase
            .from('user_essay_status')
            .select('essay_id, read')
            .eq('user_id', user.id);

        if (statusError) {
            console.error('Error fetching user status:', statusError);
            return;
        }

        // Create a map of essay_id to read status
        const statusMap = new Map(userStatus.map(status => [status.essay_id, status.read]));

        console.log('Fetched essays:', essays);

        const essayList = document.getElementById('essay-list');
        essayList.innerHTML = ''; // Clear existing list

        essays.forEach(essay => {
            const li = document.createElement('li');
            li.className = 'essay-item';
            li.innerHTML = `
                <a href="essay.html?id=${essay.id}" class="essay-link">${essay.title} (${formatDate(essay.date)})</a>
                <button class="toggle-read ${statusMap.get(essay.id) ? 'read' : ''}" data-id="${essay.id}">✓</button>
            `;
            essayList.appendChild(li);
        });

        // Add event listeners to toggle buttons
        document.querySelectorAll('.toggle-read').forEach(button => {
            button.addEventListener('click', toggleRead);
        });
    } catch (error) {
        console.error('Error in fetchEssays:', error);
    }
}

async function toggleRead(event) {
    const button = event.target;
    const essayId = button.dataset.id;
    const currentUIStatus = button.classList.contains('read');

    console.log('Attempting to toggle read status for essay:', essayId, 'Current UI status:', currentUIStatus);

    try {
        // Update the status in the database (toggle it)
        const { data, error } = await supabase
            .from('user_essay_status')
            .upsert({ 
                user_id: user.id, 
                essay_id: essayId, 
                read: !currentUIStatus 
            }, { onConflict: ['user_id', 'essay_id'] });

        if (error) {
            console.error('Error updating read status:', error);
            return;
        }

        console.log('Update operation completed');

        // Update UI
        button.classList.toggle('read');
        console.log('Status changed in database, updated UI');

        // Refresh the essay list
        await refreshEssayList();

    } catch (error) {
        console.error('Unexpected error in toggleRead:', error);
    }
}

async function refreshEssayList() {
    await fetchEssays();
}

document.getElementById('sign-out').addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error);
    } else {
        window.location.href = 'signin.html';
    }
});

try {
    await fetchEssays();
} catch (error) {
    console.error('Error in initial fetchEssays:', error);
}