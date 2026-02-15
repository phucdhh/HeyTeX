#!/usr/bin/env node
const CEREBRAS_API_KEY = 'csk-rcpemnfh4r4txmr2m528y3vepp2fv28jtjy3x5jke2kdjwhw';
const CEREBRAS_BASE_URL = 'https://api.cerebras.ai/v1';

async function testGPTOSS() {
    console.log('🧪 Testing gpt-oss-120b...');
    try {
        const response = await fetch(`${CEREBRAS_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-oss-120b',
                messages: [
                    { role: 'system', content: 'You are a LaTeX expert.' },
                    { role: 'user', content: 'Write a simple LaTeX equation for Pythagorean theorem.' }
                ],
                stream: false,
                max_tokens: 200,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Error:', response.status, errorText);
            return;
        }

        const data = await response.json();
        console.log('✅ Success!');
        console.log('Model:', data.model);
        console.log('Response:', data.choices[0].message.content);
        console.log('Tokens:', data.usage?.total_tokens);
    } catch (error) {
        console.log('❌ Exception:', error.message);
    }
}

testGPTOSS();
