import "dotenv/config";
import { db } from "../src/lib/db";
import { photos } from "../src/lib/db/schema";

async function main() {
  await db.insert(photos).values([
    { title: "Photo 1", imageUrl: "/images/img1.jpg" },
    { title: "Photo 2", imageUrl: "/images/img2.jpg" },
  ]);

  console.log("Seed completed");
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
