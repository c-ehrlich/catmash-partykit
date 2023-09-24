/* vercel is expensive */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

export const runtime = "edge";

export default async function About() {
  return (
    <div className="absolute left-0 top-0 w-screen h-screen catbg">
      <div className="flex flex-col gap-4 items-center justify-center p-4 md:w-1/2 min-h-screen mx-auto">
        <div className="self-start">
          <Link href="/" passHref className="flex gap-2">
            <img
              style={{ imageRendering: "pixelated" }}
              src="/img/cat-back.png"
              alt="Cat Back"
              width={23}
              height={21}
            />
            <span className="text-2xl font-bold text-pink-500">Go back</span>
          </Link>
        </div>
        {/* @ts-expect-error i love marquee */}
        <marquee className="text-4xl font-extrabold text-cyan-700">
          Thank you for visiting my web site.
          {/* @ts-expect-error i love marquee */}
        </marquee>
        <p className="text-xl text-red-700">
          I built this to test{" "}
          <Link
            className="text-green-700 font-bold"
            href="https://www.partykit.io/"
          >
            🎈 PartyKit
          </Link>
        </p>
        <p className="text-xl text-red-700">
          Click{" "}
          <Link
            className="text-green-700 font-bold"
            href="https://github.com/c-ehrlich/catmash-partykit"
          >
            HERE
          </Link>{" "}
          to view the source code (its not good)
        </p>
        <p className="text-xl text-red-700">
          Cat pictures courtesy of{" "}
          <Link
            className="text-green-700 font-bold"
            href="https://docs.thecatapi.com/"
          >
            The Cat Api
          </Link>
        </p>
        <Link href="https://pink73.tripod.com/CATSRINGindex65.html" passHref>
          <img
            src="/img/crazy-cat.jpg"
            alt="Crazy Cats Ring Banner"
            width={300}
            height={150}
          />
        </Link>
        <p className="text-xl text-red-700 text-center">
          If you can afford it, consider donating to{" "}
          <Link
            className="text-green-700 font-bold"
            href="https://www.cats.org.uk/donate"
          >
            Cats Protection
          </Link>{" "}
          or any other charity :)
        </p>
      </div>
    </div>
  );
}
