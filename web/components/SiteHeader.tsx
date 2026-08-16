export function SiteHeader(){
  return <header className="globalHeader">
    <div className="utilityBar">
      <a className="utilityBrand" href="https://linkoteq.com/" aria-label="LinkoTech home"><img src="/linko-logo-final.svg" alt="LinkoTech Engineering Technology" /></a>
      <nav className="utilityNav" aria-label="Utility Navigation">
        <a href="https://linkoteq.com/">Home</a>
        <div className="navMenu"><button className="navMenuButton" type="button">Contact <span>⌄</span></button><div className="navDropdown"><a href="https://linkoteq.com/contact">Contact Us</a><a href="https://discovery.linkoteq.com/">Customer Discovery</a><a href="https://linkoteq.com/contact/support">Support</a></div></div>
        <div className="navMenu"><button className="navMenuButton" type="button">About <span>⌄</span></button><div className="navDropdown"><a href="https://linkoteq.com/about">About Linko</a><a href="https://timesheet.linkoteq.com/">Team Timesheet</a></div></div>
        <a href="https://linkoteq.com/pricing">Pricing</a>
        <div className="navMenu"><button className="navMenuButton" type="button">Calculators <span>⌄</span></button><div className="navDropdown"><a href="https://wsection.linkoteq.com/">W-Section</a><a href="https://snow.linkoteq.com/">Snow Load</a></div></div>
      </nav>
      <div className="navMenu signInMenu"><button className="navCta navMenuButton" type="button">Sign In <span>⌄</span></button><div className="navDropdown signInDropdown"><a href="https://linkoteq.com/blog/login">Employee Workspace</a><a href="https://linkoteq.com/customer-login">Client Workspace</a></div></div>
    </div>
    <nav className="primaryBar" aria-label="Primary Navigation"><a href="https://linkoteq.com/">Home</a><a href="https://linkoteq.com/#platform">AI Platform</a><a href="https://linkoteq.com/#roadmap">Roadmap</a><a href="https://linkoteq.com/knowledge/documentation">Knowledge Center</a><a href="https://linkoteq.com/blog">Blog</a></nav>
  </header>;
}
