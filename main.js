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
        await fetchEssays();
        setupSignOut();
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

async function fetchEssays() {
    console.log('Fetching essays...');
    try {
        // Fetch all essays
        const { data: essays, error: essaysError } = await supabase
            .from('essays')
            .select('*')
            .order('date', { ascending: false });

        if (essaysError) {
            console.error('Error fetching essays:', essaysError);
            return;
        }

        console.log('Fetched essays:', essays);

        // Fetch user's read status for essays
        const { data: userStatus, error: statusError } = await supabase
            .from('user_essay_status')
            .select('essay_id, read')
            .eq('user_id', user.id);

        if (statusError) {
            console.error('Error fetching user status:', statusError);
            return;
        }

        console.log('Fetched user status:', userStatus);

        // Create a map of essay_id to read status
        const statusMap = new Map(userStatus.map(status => [status.essay_id, status.read]));

        // Calculate progress
        const totalEssays = essays.length;
        const readEssays = userStatus.filter(status => status.read).length;
        const progressPercentage = (readEssays / totalEssays) * 100;

        // Update progress bar and text
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        progressFill.style.width = `${progressPercentage}%`;
        progressText.textContent = `${progressPercentage.toFixed(1)}% (${readEssays} of ${totalEssays} essays read)`;

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

        console.log('Essays displayed successfully');
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
                .update({ read: !currentUIStatus })
                .eq('user_id', user.id)
                .eq('essay_id', essayId);
        } else {
            // Insert new status
            result = await supabase
                .from('user_essay_status')
                .insert({ user_id: user.id, essay_id: essayId, read: !currentUIStatus });
        }

        const { error } = result;

        if (error) {
            console.error('Error updating read status:', error);
            return;
        }

        console.log('Update operation completed');

        // Update UI
        button.classList.toggle('read');
        console.log('Status changed in database, updated UI');

        // Update progress
        await updateProgress();

    } catch (error) {
        console.error('Unexpected error in toggleRead:', error);
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

    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    progressFill.style.width = `${progressPercentage}%`;
    progressText.textContent = `${progressPercentage.toFixed(1)}% (${readCount} of ${totalEssays} essays read)`;
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

init();

// Add estimated reading time
document.addEventListener('DOMContentLoaded', function() {
    const essayContent = document.getElementById('essay-content').innerText;
    const readingTimeElement = document.getElementById('reading-time');

    // Function to calculate reading time
    function calculateReadingTime(text) {
        const wordsPerMinute = 200; // Average reading speed
        const words = text.split(/\s+/).filter(word => word.length > 0).length; // Count words
        const minutes = Math.ceil(words / wordsPerMinute);
        return minutes;
    }

    // Calculate and display the reading time
    const readingTime = calculateReadingTime(essayContent);
    readingTimeElement.textContent = `Estimated reading time: ${readingTime} min`;
});