export const generateVideoJsonLd = (video) => ({
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: video.title,
  description: video.description,
  thumbnailUrl: video.thumbnailUrl,
  uploadDate: video.recordingDate,
  duration: video.duration,
  contentUrl: video.videoUrl,
  author: {
    "@type": "Organization",
    name: "At-Taleem",
    url: process.env.NEXT_PUBLIC_APP_URL,
  },
  publisher: {
    "@type": "Organization",
    name: "At-Taleem",
    logo: {
      "@type": "ImageObject",
      url: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
    },
  },
});

export const generateBookJsonLd = (book) => ({
  "@context": "https://schema.org",
  "@type": "Book",
  name: book.title,
  description: book.description,
  author: {
    "@type": "Person",
    name: book.author,
  },
  publisher: {
    "@type": "Organization",
    name: "At-Taleem",
  },
  image: book.coverImage,
  datePublished: book.publishedDate,
  isbn: book.isbn,
  inLanguage: ["en", "bn"],
  offers: {
    "@type": "Offer",
    availability: book.inStock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    price: book.price,
    priceCurrency: "BDT",
  },
});

export const generateQuestionJsonLd = (question) => ({
  "@context": "https://schema.org",
  "@type": "Question",
  name: question.title,
  text: question.content,
  dateCreated: question.createdAt,
  author: {
    "@type": "Person",
    name: question.username,
  },
  answerCount: question.answers?.length || 1,
  Votes: question.helpfulVotes?.length || 0,
});

export const generateEventJsonLd = (event) => ({
  "@context": "https://schema.org",
  "@type": "Event",
  name: event.title,
  description: event.description,
  startDate: event.startDate,
  location: {
    "@type": "Place",
    name: event.location,
    address: {
      "@type": "PostalAddress",
      streetAddress: event.address,
    },
  },
  organizer: {
    "@type": "Organization",
    name: "At-Taleem",
    url: process.env.NEXT_PUBLIC_APP_URL,
  },
  image: event.image,
  offers: {
    "@type": "Offer",
    price: event.price || "0",
    priceCurrency: "BDT",
    availability: event.isFree
      ? "https://schema.org/InStock"
      : "https://schema.org/PreOrder",
  },
});
