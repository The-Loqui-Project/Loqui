import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

const cicero =
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium" +
  " doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo " +
  "inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo." +
  " Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut " +
  "fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem " +
  "sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit" +
  " amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora" +
  " incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim" +
  " ad minima veniam, quis nostrum exercitationem ullam corporis suscipit" +
  " laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum" +
  " iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae" +
  " consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?";

function ProjectCard({
  slug,
  title,
  desc,
  incomplete,
  total,
}: {
  slug: string;
  title: string;
  desc: string;
  incomplete: number;
  total: number;
}) {
  return (
    <Link href={`projects/${slug}`}>
      <Card className="p-2">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>
        <CardFooter className="grow flex-row">
          <CardDescription className="float-left">
            missing {incomplete}/{total} translations
          </CardDescription>
        </CardFooter>
      </Card>
    </Link>
  );
}

export default function ProjectsPage() {
  return (
    <div className="mx-auto w-svw flex">
      <main className="flex flex-col mx-auto max-w-[80ch] gap-4">
        <h1 className="text-4xl">Your Projects</h1>
        <ProjectCard
          slug="test"
          title="Example Project"
          desc={cicero}
          incomplete={0}
          total={12}
        />
        <ProjectCard
          slug="test"
          title="Example Project"
          desc={cicero}
          incomplete={0}
          total={12}
        />
        <ProjectCard
          slug="test"
          title="Example Project"
          desc={cicero}
          incomplete={0}
          total={12}
        />
        <ProjectCard
          slug="test"
          title="Example Project"
          desc={cicero}
          incomplete={0}
          total={12}
        />
        <ProjectCard
          slug="test"
          title="Example Project"
          desc={cicero}
          incomplete={0}
          total={12}
        />
        <ProjectCard
          slug="test"
          title="Example Project"
          desc={cicero}
          incomplete={0}
          total={12}
        />
        <ProjectCard
          slug="test"
          title="Example Project"
          desc={cicero}
          incomplete={0}
          total={12}
        />
      </main>
    </div>
  );
}
