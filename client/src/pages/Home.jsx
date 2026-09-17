export default function Home() {
  return (
    <div className="page page-home">
      <div className="card">
        <h1>AI Capsule</h1>
        <p>
          A private prompt library. Save the AI prompts that actually
          worked — with the project, version, category, and whether the
          result was useful — so you can find and reuse them later instead
          of losing them in chat history.
        </p>
        <ul className="feature-list">
          <li>Sign in with your GitHub account</li>
          <li>Keep prompt records private to your account</li>
          <li>Create, review, update and delete your capsules</li>
        </ul>
        {/* Plain <a>, not a React Router Link — this must hit the server's
            real /login route (which redirects to GitHub), not be swallowed
            by client-side routing. */}
        <a className="btn btn-primary" href="/login">
          Sign in with GitHub
        </a>
      </div>
    </div>
  );
}
