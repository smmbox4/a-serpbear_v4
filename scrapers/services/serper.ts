import { resolveCountryCode } from "../../utils/scraperHelpers";
import { parseLocation } from "../../utils/location";
import { getGoogleDomain } from "../../utils/googleDomains";

interface SerperResult {
  title: string;
  link: string;
  position: number;
}

const serper: ScraperSettings = {
  id: "serper",
  name: "Serper.dev",
  website: "serper.dev",
  allowsCity: true,
  supportsMapPack: false,
  scrapeURL: (keyword, settings, countryData) => {
    const countryCode = resolveCountryCode(keyword.country);
    const fallbackInfo =
      countryData[countryCode] ??
      countryData.US ??
      Object.values(countryData)[0];
    const gl = countryCode;
    const lang = fallbackInfo?.[2] ?? "en";
    const countryName = fallbackInfo?.[0];
    const { city, state } = parseLocation(keyword.location, keyword.country);
    const plusEncode = (str: string) => str.replace(/ /g, "+");
    const decodeIfEncoded = (value: string): string => {
      try {
        return decodeURIComponent(value);
      } catch (_error) {
        return value;
      }
    };
    const locationParts = [city, state, countryName]
      .filter((v): v is string => Boolean(v))
      .map((part) => plusEncode(decodeIfEncoded(part)));
    const params = new URLSearchParams();
    params.set("q", plusEncode(decodeIfEncoded(keyword.keyword)));
    if ((city || state) && locationParts.length) {
      params.set("location", locationParts.join(","));
    }
    params.set("gl", gl);
    params.set("hl", lang);
    params.set("apiKey", settings.scraping_api ?? "");
    return `https://google.serper.dev/search?${params.toString()}`;
  },
  resultObjectKey: "organic",
  serpExtractor: ({ result, response }) => {
    const extractedResult = [];
    let results: SerperResult[] = [];

    if (typeof result === "string") {
      try {
        results = JSON.parse(result) as SerperResult[];
      } catch (error) {
        throw new Error(
          `Invalid JSON response for Serper.dev: ${
            error instanceof Error ? error.message : error
          }`
        );
      }
    } else if (Array.isArray(result)) {
      results = result as SerperResult[];
    } else if (Array.isArray(response?.organic)) {
      results = response.organic as SerperResult[];
    }

    for (const { link, title, position } of results) {
      if (title && link) {
        extractedResult.push({
          title,
          url: link,
          position,
        });
      }
    }

    return { organic: extractedResult, mapPackTop3: false };
  },
};

export default serper;
