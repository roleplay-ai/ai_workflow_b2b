import Link from "next/link";
import { getTheme, Scene } from "@/components/ActivityCard";

type Props = {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
};

export default function SuggestedWorkflowCard({ id, title, description, thumbnailUrl }: Props) {
  const theme = getTheme(id);

  return (
    <Link href={`/activity/${id}`} className="workflow-card ask-mini-workflow-card">
      <div className={`card-poster ${theme.posterColor}${thumbnailUrl ? " has-thumbnail" : ""}`}>
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="card-thumbnail" src={thumbnailUrl} alt="" />
        ) : (
          <Scene theme={theme} />
        )}
      </div>
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        {description ? <p className="card-desc">{description}</p> : null}
      </div>
    </Link>
  );
}
