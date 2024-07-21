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

    console.log('Attempting to toggle read status for essay:', essayId, 'Current UI status:', currentStatus);

    try {
        // Update the status
        const { data, error } = await supabase
            .from('essays')
            .update({ read: !currentStatus })
            .eq('id', essayId);

        if (error) {
            console.error('Error updating read status:', error);
            return;
        }

        console.log('Update operation completed');

        // Verify the update
        const { data: verifyData, error: verifyError } = await supabase
            .from('essays')
            .select('id, read')
            .eq('id', essayId)
            .single();

        if (verifyError) {
            console.error('Error verifying update:', verifyError);
            return;
        }

        console.log('Verified essay status after update:', verifyData);

        // Update UI based on verified status
        if (verifyData.read !== currentStatus) {
            button.classList.toggle('read');
            console.log('Status changed in database, updated UI');
        } else {
            console.log('No change in database status, UI remains the same');
        }

        // Refresh the essay list
        await refreshEssayList();

    } catch (error) {
        console.error('Unexpected error in toggleRead:', error);
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

async function logTableStructure() {
    try {
        // Fetch a single row to get column information
        const { data, error } = await supabase
            .from('essays')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error fetching sample data:', error);
            return;
        }

        if (data && data.length > 0) {
            console.log('Essays table structure:');
            for (const [key, value] of Object.entries(data[0])) {
                console.log(`${key}: ${typeof value}`);
            }
        } else {
            console.log('No data found in the essays table');
        }

        // Fetch table information
        const { data: tableInfo, error: tableError } = await supabase
            .from('essays')
            .select('count');

        if (tableError) {
            console.error('Error fetching table info:', tableError);
        } else {
            console.log('Total rows in essays table:', tableInfo.length);
        }

    } catch (error) {
        console.error('Unexpected error in logTableStructure:', error);
    }
}

// Call this function when the page loads
logTableStructure();