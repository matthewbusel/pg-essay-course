import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client
const supabaseUrl = 'https://gixsylknwstdekjfvnlc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpeHN5bGtud3N0ZGVramZ2bmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE1ODAyOTQsImV4cCI6MjAzNzE1NjI5NH0.byzzFJaeGPf6lLaaKhhOZuaqSf2sya7QJvHq9jD0XEI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchEssay() {
    const urlParams = new URLSearchParams(window.location.search);
    const essayId = urlParams.get('id');

    if (!essayId) {
        console.error('No essay ID provided');
        return;
    }

    console.log('Fetching essay with ID:', essayId);

    // Fetch essay from Supabase
    const { data, error } = await supabase
        .from('essays')
        .select('*')
        .eq('id', essayId)
        .single();

    if (error) {
        console.error('Error fetching essay:', error);
        return;
    }

    console.log('Fetched essay data:', data);

    // Update page content
    document.title = data.title;
    document.getElementById('essay-title').textContent = data.title;
    document.getElementById('essay-date').textContent = data.date;
    document.getElementById('essay-content').innerHTML = data.content;

    const toggleButton = document.getElementById('toggle-read');
    toggleButton.classList.toggle('read', data.read);
    toggleButton.textContent = data.read ? 'Mark as Unread' : 'Mark as Read';
    toggleButton.addEventListener('click', () => toggleRead(essayId));
}

async function toggleRead(essayId) {
    const toggleButton = document.getElementById('toggle-read');
    const currentStatus = toggleButton.classList.contains('read');

    console.log('Toggling read status for essay:', essayId);

    // Update read status in Supabase
    const { data, error } = await supabase
        .from('essays')
        .update({ read: !currentStatus })
        .eq('id', essayId);

    if (error) {
        console.error('Error updating read status:', error);
        return;
    }

    console.log('Updated read status:', !currentStatus);

    // Toggle button appearance and text
    toggleButton.classList.toggle('read');
    toggleButton.textContent = currentStatus ? 'Mark as Read' : 'Mark as Unread';
}

fetchEssay();