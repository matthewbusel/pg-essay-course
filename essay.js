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

async function fetchEssay() {
    const urlParams = new URLSearchParams(window.location.search);
    const essayId = urlParams.get('id');

    if (!essayId) {
        console.error('No essay ID provided');
        return;
    }

    console.log('Fetching essay with ID:', essayId);

    try {
        // Fetch essay from Supabase
        const { data: essay, error: essayError } = await supabase
            .from('essays')
            .select('*')
            .eq('id', essayId)
            .single();

        if (essayError) {
            console.error('Error fetching essay:', essayError);
            return;
        }

        // Fetch user's read status for this essay
        const { data: userStatus, error: statusError } = await supabase
            .from('user_essay_status')
            .select('read')
            .eq('user_id', user.id)
            .eq('essay_id', essayId)
            .single();

        if (statusError && statusError.code !== 'PGRST116') { // PGRST116 means no rows returned
            console.error('Error fetching user status:', statusError);
            return;
        }

        console.log('Fetched essay data:', essay);
        console.log('Fetched user status:', userStatus);

        // Update page content
        document.title = essay.title;
        document.getElementById('essay-title').textContent = essay.title;
        document.getElementById('essay-date').textContent = formatDate(essay.date);
        document.getElementById('essay-content').innerHTML = essay.content;

        const toggleButton = document.getElementById('toggle-read');
        toggleButton.classList.toggle('read', userStatus?.read || false);
        toggleButton.textContent = userStatus?.read ? 'Mark as Unread' : 'Mark as Read';
        toggleButton.addEventListener('click', () => toggleRead(essayId));
    } catch (error) {
        console.error('Error in fetchEssay:', error);
    }
}

async function toggleRead(essayId) {
    const toggleButton = document.getElementById('toggle-read');
    const currentStatus = toggleButton.classList.contains('read');

    console.log('Toggling read status for essay:', essayId);

    try {
        // Update read status in Supabase
        const { data, error } = await supabase
            .from('user_essay_status')
            .upsert({ 
                user_id: user.id, 
                essay_id: essayId, 
                read: !currentStatus 
            }, { onConflict: ['user_id', 'essay_id'] });

        if (error) {
            console.error('Error updating read status:', error);
            return;
        }

        console.log('Updated essay data:', data);

        // Toggle button appearance and text
        toggleButton.classList.toggle('read');
        toggleButton.textContent = currentStatus ? 'Mark as Read' : 'Mark as Unread';
        console.log('Toggled read status successfully');
    } catch (error) {
        console.error('Error in toggleRead:', error);
    }
}

document.getElementById('sign-out').addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error);
    } else {
        window.location.href = 'signin.html';
    }
});

fetchEssay();