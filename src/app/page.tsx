"use client";

import { useSession } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Home() {
  const { isSignedIn } = useSession();

  const thumbnails = useQuery(api.thumbnails.getThumbnailsForUser);

  return (
    <main className="">
      {isSignedIn && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget as HTMLFormElement;
            const formData = new FormData(form);
            const title = formData.get("title") as string;
            // await createThumbnail({ title });
            form.reset();
          }}
        >
          <label htmlFor="title">Title</label>
          <input name="title" className="text-black" placeholder="Title" />
          <button type="submit">Create</button>
        </form>
      )}

      <div>
        {thumbnails?.map((thumbnail) => (
          <div key={thumbnail._id}>{thumbnail.title}</div>
        ))}
      </div>
    </main>
  );
}
