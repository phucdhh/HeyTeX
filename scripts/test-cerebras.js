#!/usr/bin/env node
/**
 * Test script for Cerebras AI integration
 * This tests both Llama 3.1 8B and Llama 3.3 70B models
 */

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
if (!CEREBRAS_API_KEY) {
    console.error('❌ CEREBRAS_API_KEY environment variable is required');
    process.exit(1);
}
const CEREBRAS_BASE_URL = 'https://api.cerebras.ai/v1';

async function testCerebrasModel(modelName) {
    console.log(`\n🧪 Testing ${modelName}...`);
    console.log('─'.repeat(50));

    try {
        const response = await fetch(`${CEREBRAS_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful LaTeX assistant.'
                    },
                    {
                        role: 'user',
                        content: 'Write a simple LaTeX document with a title and one paragraph.'
                    }
                ],
                stream: false,
                max_tokens: 500,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Error: ${response.status} ${response.statusText}`);
            console.error(`   Details: ${errorText}`);
            return false;
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (content) {
            console.log(`✅ Success! Response received:`);
            console.log(`   Model: ${data.model}`);
            console.log(`   Tokens used: ${data.usage?.total_tokens || 'N/A'}`);
            console.log(`\n📝 Generated content:`);
            console.log(content.substring(0, 200) + (content.length > 200 ? '...' : ''));
            return true;
        } else {
            console.error('❌ No content in response');
            return false;
        }
    } catch (error) {
        console.error(`❌ Exception: ${error.message}`);
        return false;
    }
}

async function testStreamingAPI(modelName) {
    console.log(`\n🌊 Testing streaming API with ${modelName}...`);
    console.log('─'.repeat(50));

    try {
        const response = await fetch(`${CEREBRAS_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    {
                        role: 'user',
                        content: 'Count from 1 to 5.'
                    }
                ],
                stream: true,
                max_tokens: 100,
            }),
        });

        if (!response.ok) {
            console.error(`❌ Streaming failed: ${response.statusText}`);
            return false;
        }

        console.log('✅ Streaming response:');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content;
                        if (content) {
                            process.stdout.write(content);
                            fullContent += content;
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }
        }

        console.log('\n✅ Streaming test completed!');
        return true;
    } catch (error) {
        console.error(`❌ Streaming exception: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 Cerebras AI Integration Test');
    console.log('═'.repeat(50));

    // Test model list API
    console.log('\n📋 Testing model list API...');
    try {
        const response = await fetch(`${CEREBRAS_BASE_URL}/models`, {
            headers: {
                'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Available models: ${data.data.length}`);
            data.data.forEach(model => {
                console.log(`   - ${model.id}`);
            });
        } else {
            console.error(`❌ Failed to fetch models: ${response.statusText}`);
        }
    } catch (error) {
        console.error(`❌ Exception: ${error.message}`);
    }

    // Test Llama 3.1 8B
    const test1 = await testCerebrasModel('llama-3.1-8b');

    // Test Llama 3.3 70B (or another available model)
    const test2 = await testCerebrasModel('llama-3.3-70b');

    // Test streaming
    const test3 = await testStreamingAPI('llama-3.1-8b');

    // Summary
    console.log('\n═'.repeat(50));
    console.log('📊 Test Summary:');
    console.log(`   Llama 3.1 8B: ${test1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Llama 3.3 70B: ${test2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Streaming: ${test3 ? '✅ PASS' : '❌ FAIL'}`);
    console.log('═'.repeat(50));

    const allPassed = test1 && test2 && test3;
    console.log(allPassed ? '\n🎉 All tests passed!' : '\n⚠️  Some tests failed');
    process.exit(allPassed ? 0 : 1);
}

main();
