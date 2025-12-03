import { ReactNode } from "react";

type PageShellProps = {
  title: string;
  description?: string;
  note?: string;
  children?: ReactNode;
};

function PageShell({ title, description, note, children }: PageShellProps) {
  return (
    <div className="page-shell">
      <div className="container page-header">
        {note ? <p className="eyebrow">{note}</p> : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-lead">{description}</p> : null}
      </div>
      {children ? <div className="container page-body">{children}</div> : null}
    </div>
  );
}

export default PageShell;
