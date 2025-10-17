// src/lib/fetchWiki.ts

export async function fetchWikiSummary(query: string) {
  try {
    // Format query for Wikipedia search
    const formatted = query
      .trim()
      .replace(/\s+/g, "_")
      .replace(/\?/g, "");

    // Step 1: Try to get direct summary
    const summaryRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${formatted}`
    );

    // If not found, do a search instead
    if (summaryRes.status === 404) {
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          query
        )}&utf8=&format=json&origin=*`
      );
      const searchData = await searchRes.json();

      if (
        !searchData.query?.search?.length ||
        !searchData.query.search[0]?.title
      ) {
        return `I couldn't find any reliable info about "${query}".`;
      }

      const bestTitle = searchData.query.search[0].title;

      // Try fetching summary again with the best title
      const bestRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${bestTitle}`
      );
      const bestData = await bestRes.json();

      return bestData.extract || `No summary available for ${bestTitle}.`;
    }

    // Step 2: Return main summary
    const summaryData = await summaryRes.json();
    if (!summaryData.extract) {
      return `No detailed info found for "${query}".`;
    }

    return summaryData.extract;
  } catch (error) {
    console.error("Error fetching wiki data:", error);
    return "I had trouble fetching that info right now.";
  }
}
