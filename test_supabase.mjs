import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://eldqjknelcvchmtqtdkg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZHFqa25lbGN2Y2htdHF0ZGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODk2NDMsImV4cCI6MjA4ODU2NTY0M30.VrqF3TerAdN7t8S019bL4PMJJB-dwZg9Z0zeKIR1PbA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    console.log('Testing connection...');

    // 2. Try to insert a profile
    const testAddress = '0xTestAddress' + Date.now();
    const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert([{ wallet_address: testAddress, total_balance: 0 }])
        .select();

    console.log('--- Profile Insert ---');
    if (insertError) {
        fs.writeFileSync('error_output.json', JSON.stringify(insertError, null, 2));
        console.log('Error written to error_output.json');
    } else {
        console.log('Inserted profile:', inserted);
    }
}

testConnection();
