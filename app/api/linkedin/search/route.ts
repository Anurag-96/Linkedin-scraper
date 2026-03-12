import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query, serpApiKey: bodySerpKey } = await req.json();

    // 1. Priority: SerpApi (Google Search for LinkedIn Posts)
    const serpApiKey = (bodySerpKey || process.env.SERPAPI_API_KEY || '').trim();

    if (serpApiKey) {
      console.log(`Using SerpApi (Key starts with: ${serpApiKey.substring(0, 4)}...)`);
      try {
        const searchParams = new URLSearchParams({
          engine: 'google',
          q: `site:linkedin.com/posts "${query}"`,
          api_key: serpApiKey,
          num: '20' // Get top 20 results
        });

        const serpRes = await fetch(`https://serpapi.com/search.json?${searchParams.toString()}`);

        if (!serpRes.ok) {
          const errText = await serpRes.text();
          console.error('SerpApi search failed:', errText);
          return NextResponse.json({ 
            error: `SerpApi search failed: ${errText}. Please check your API Key.` 
          }, { status: 400 });
        }

        const data = await serpRes.json();
        const results = data.organic_results || [];
        
        console.log(`SerpApi returned ${results.length} results.`);
        
        return NextResponse.json({
          source: 'serpapi',
          raw_data: results
        });
      } catch (serpError: any) {
        console.error('SerpApi integration error:', serpError);
        return NextResponse.json({ error: `SerpApi integration error: ${serpError.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      error: 'SerpApi API key is missing. Please configure it in the settings menu (gear icon).' 
    }, { status: 400 });
  } catch (error) {
    console.error('Advanced Search Error:', error);
    return NextResponse.json({ error: 'An internal error occurred during the Advanced Search.' }, { status: 500 });
  }
}
