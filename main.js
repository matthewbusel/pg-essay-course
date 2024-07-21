import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client
const supabaseUrl = 'https://gixsylknwstdekjfvnlc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpeHN5bGtud3N0ZGVramZ2bmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE1ODAyOTQsImV4cCI6MjAzNzE1NjI5NH0.byzzFJaeGPf6lLaaKhhOZuaqSf2sya7QJvHq9jD0XEI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test Supabase connection
supabase.from('essays').select('count', { count: 'exact' }).then(({ count, error }) => {
    if (error) {
        console.error('Error connecting to Supabase:', error);
    } else {
        console.log('Successfully connected to Supabase. Essay count:', count);
    }
});

async function fetchEssays() {
    console.log('Fetching essays...');
    try {
        // Fetch essays from Supabase
        const { data, error } = await supabase
            .from('essays')
            .select('*')
            .order('date', { ascending: true });

        if (error) {
            console.error('Error fetching essays:', error);
            return;
        }

        console.log('Fetched essays:', data);

        const essayList = document.getElementById('essay-list');
        essayList.innerHTML = ''; // Clear existing list

        data.forEach(essay => {
            const li = document.createElement('li');
            li.className = 'essay-item';
            li.innerHTML = `
                <a href="essay.html?id=${essay.id}" class="essay-link">${essay.title} (${essay.date})</a>
                <button class="toggle-read ${essay.read ? 'read' : ''}" data-id="${essay.id}">✓</button>
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
    const currentStatus = button.classList.contains('read');

    console.log('Toggling read status for essay:', essayId, 'Current status:', currentStatus);

    try {
        // Update read status in Supabase
        const { data, error } = await supabase
            .from('essays')
            .update({ read: !currentStatus })
            .eq('id', essayId)
            .select();

        if (error) {
            console.error('Error updating read status:', error);
            return;
        }

        console.log('Updated essay data:', data);

        if (data && data.length > 0) {
            // Toggle button appearance
            button.classList.toggle('read');
            console.log('Toggled read status successfully');
            await refreshEssayList(); // Refresh the essay list
        } else {
            console.error('No data returned after update');
        }
    } catch (error) {
        console.error('Error in toggleRead:', error);
    }
}

async function refreshEssayList() {
    await fetchEssays();
}

try {
    await fetchEssays();
} catch (error) {
    console.error('Error in initial fetchEssays:', error);
}