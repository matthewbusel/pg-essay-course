import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://gixsylknwstdekjfvnlc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpeHN5bGtud3N0ZGVramZ2bmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE1ODAyOTQsImV4cCI6MjAzNzE1NjI5NH0.byzzFJaeGPf6lLaaKhhOZuaqSf2sya7QJvHq9jD0XEI';
const supabase = createClient(supabaseUrl, supabaseKey);

let user;

async function checkAuth() {
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Error checking auth:', error);
        return null;
    }
    if (!authUser) {
        window.location.href = 'signin.html';
        return null;
    }
    return authUser;
}

async function init() {
    user = await checkAuth();
    if (user) {
        console.log('User authenticated:', user);
        await fetchEssay();
        setupSignOut();
    }
}

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

        console.log('Fetched essay data:', essay);

        // Fetch user's read status for this essay
        const { data: userStatus, error: statusError } = await supabase
            .from('user_essay_status')
            .select('read')
            .eq('user_id', user.id)
            .eq('essay_id', essayId)
            .single();

        if (statusError && statusError.code !== 'PGRST116') {
            console.error('Error fetching user status:', statusError);
        }

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
        // First, check if the status already exists
        const { data: existingStatus, error: checkError } = await supabase
            .from('user_essay_status')
            .select('*')
            .eq('user_id', user.id)
            .eq('essay_id', essayId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking existing status:', checkError);
            return;
        }

        let result;
        if (existingStatus) {
            // Update existing status
            result = await supabase
                .from('user_essay_status')
                .update({ read: !currentStatus })
                .eq('user_id', user.id)
                .eq('essay_id', essayId);
        } else {
            // Insert new status
            result = await supabase
                .from('user_essay_status')
                .insert({ user_id: user.id, essay_id: essayId, read: !currentStatus });
        }

        const { error } = result;

        if (error) {
            console.error('Error updating read status:', error);
            return;
        }

        console.log('Updated essay data:', result.data);

        // Toggle button appearance and text
        toggleButton.classList.toggle('read');
        toggleButton.textContent = currentStatus ? 'Mark as Read' : 'Mark as Unread';
        console.log('Toggled read status successfully');

        // Update progress
        await updateProgress();

    } catch (error) {
        console.error('Error in toggleRead:', error);
    }
}

async function updateProgress() {
    const { data: essays, error: essaysError } = await supabase
        .from('essays')
        .select('count', { count: 'exact' });

    const { data: readEssays, error: readError } = await supabase
        .from('user_essay_status')
        .select('count', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('read', true);

    if (essaysError || readError) {
        console.error('Error updating progress:', essaysError || readError);
        return;
    }

    const totalEssays = essays[0].count;
    const readCount = readEssays[0].count;
    const progressPercentage = (readCount / totalEssays) * 100;

    console.log(`Progress updated: ${progressPercentage.toFixed(1)}% (${readCount} of ${totalEssays} essays read)`);
}

function setupSignOut() {
    const signOutButton = document.getElementById('sign-out');
    if (signOutButton) {
        signOutButton.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Error signing out:', error);
            } else {
                window.location.href = 'signin.html';
            }
        });
    }
}

// Add estimated reading time
document.addEventListener('DOMContentLoaded', function() {
    const essayContent = document.getElementById('essay-content').innerText;
    const readingTimeElement = document.getElementById('reading-time');

    console.log(essayContent);

    // Function to calculate reading time
    function calculateReadingTime(text) {
        const wordsPerMinute = 200; // Average reading speed
        const words = text.split(/\s+/).length;
        console.log(`Words: ${words}`);
        const minutes = Math.ceil(words / wordsPerMinute);
        console.log(`Minutes: ${minutes}`);
        return minutes;
    }

    // Calculate and display the reading time
    const readingTime = calculateReadingTime(essayContent);
    readingTimeElement.textContent = `Estimated reading time: ${readingTime} min`;
});

init();