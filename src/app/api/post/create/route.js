import { slugify } from "transliteration";
import Post from "../../../../lib/models/post.model.js";
import { connect } from "../../../../lib/mongodb/mongoose.js";
import { currentUser } from "@clerk/nextjs/server";

export const POST = async (req) => {
  const user = await currentUser();
  try {
    await connect();
    const data = await req.json();

    if (
      !user ||
      user.publicMetadata.userMongoId !== data.userMongoId ||
      user.publicMetadata.isAdmin !== true
    ) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Generate slug directly from the original title with transliteration.
    function generateSlug(title) {
      const base = slugify(title, {
        lower: true,
        separator: "-",
      });
      const shortBase = base.split("-").slice(0, 3).join("-"); // keep only first 3 words
      const uniqueSuffix = Date.now().toString(36); // a short unique string
      return `${shortBase}-${uniqueSuffix}`;
    }

    const slug = generateSlug(data.title);
    const newPost = await Post.create({
      userId: user.publicMetadata.userMongoId,
      content: data.content,
      title: data.title,
      image: data.image,
      category: data.category,
      slug,
    });
    // Optionally, if create already saves, you might not need newPost.save()
    await newPost.save();
    return new Response(JSON.stringify(newPost), { status: 200 });
  } catch (error) {
    console.log("Error creating post:", error);
    return new Response("Error creating post", { status: 500 });
  }
};
