import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://gixsylknwstdekjfvnlc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpeHN5bGtud3N0ZGVramZ2bmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE1ODAyOTQsImV4cCI6MjAzNzE1NjI5NH0.byzzFJaeGPf6lLaaKhhOZuaqSf2sya7QJvHq9jD0XEI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Check if user is signed in
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'signin.html';
    }
    return user;
}

let user;

async function init() {
    user = await checkAuth();
    if (user) {
        await fetchEssays();
        setupSignOut();
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

async function fetchEssays() {
    // ... (rest of the fetchEssays function remains the same)
}

async function toggleRead(event) {
    // ... (rest of the toggleRead function remains the same)
}

async function refreshEssayList() {
    await fetchEssays();
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