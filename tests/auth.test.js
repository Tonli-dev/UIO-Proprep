import { describe, expect, it } from "vitest";
import { getAuthRedirectUrl } from "../src/auth.js";

describe("auth redirect URL", () => {
  it("koristi trenutni origin tokom lokalnog razvoja", () => {
    expect(
      getAuthRedirectUrl({
        origin: "http://localhost:5173",
        productionUrl: "https://uio-proprep.vercel.app",
        isProduction: false
      })
    ).toBe("http://localhost:5173/");
  });

  it("koristi kanonsku domenu u produkciji", () => {
    expect(
      getAuthRedirectUrl({
        origin: "https://uio-proprep-preview.vercel.app",
        productionUrl: "https://carina.tonli.dev",
        isProduction: true
      })
    ).toBe("https://carina.tonli.dev/");
  });

  it("ima sigurnu produkcijsku vrijednost i bez env varijable", () => {
    expect(
      getAuthRedirectUrl({
        origin: "http://localhost:5173",
        productionUrl: "",
        isProduction: true
      })
    ).toBe("https://carina.tonli.dev/");
  });
});
