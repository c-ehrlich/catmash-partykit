import z from "zod";
import { type Cats } from "../partykit/server";

const catApiResponseSchema = z
  .array(
    z.object({
      id: z.string(),
      url: z.string().url(),
      width: z.number(),
      height: z.number(),
    })
  )
  .min(2);

export async function getCatPair(): Promise<Cats> {
  const cats = await fetch(
    "https://api.thecatapi.com/v1/images/search?limit=10"
  ).then((res) => res.json());

  const parsedCats = catApiResponseSchema.parse(cats);

  return {
    a: {
      id: parsedCats[0].id,
      votes: [],
      url: parsedCats[0].url,
      width: parsedCats[0].width,
      height: parsedCats[0].height,
    },
    b: {
      id: parsedCats[1].id,
      votes: [],
      url: parsedCats[1].url,
      width: parsedCats[1].width,
      height: parsedCats[1].height,
    },
  };
}
