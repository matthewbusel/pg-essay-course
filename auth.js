import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        console.error('Error signing in:', error.message);
        return;
    }

    console.log('Signed in successfully:', data);
    window.location.href = 'index.html';
}

async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        console.error('Error signing up:', error.message);
        return;
    }

    console.log('Signed up successfully:', data);
    window.location.href = 'index.html';
}

document.getElementById('signin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await signIn(email, password);
});

document.getElementById('signup-link').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await signUp(email, password);
});

// Check if user is already signed in
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'signin.html';
    }
}

checkAuth();