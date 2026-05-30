import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-card/30">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="font-display text-lg font-bold">Marburg Connect</div>
          <p className="mt-2 text-sm text-muted-foreground">
            A digital platform for international residents, students, professionals & families in Marburg.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/communities" className="hover:text-foreground">Communities</Link></li>
            <li><Link to="/marketplace" className="hover:text-foreground">Marketplace</Link></li>
            <li><Link to="/accommodation" className="hover:text-foreground">Accommodation</Link></li>
            <li><Link to="/jobs" className="hover:text-foreground">Jobs</Link></li>
            <li><Link to="/qa" className="hover:text-foreground">Q&A</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Support</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/reports/new" className="hover:text-foreground">Report discrimination</Link></li>
            <li><Link to="/auth/login" className="hover:text-foreground">Sign in</Link></li>
            <li><Link to="/auth/register" className="hover:text-foreground">Create account</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">About</h4>
          <p className="text-sm text-muted-foreground">
            Built with care for Marburg's international community.
          </p>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Marburg Connect
      </div>
    </footer>
  );
}
