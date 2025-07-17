export default function ExternalTools() {
  const finance = [
    { name: 'Xero', url: 'https://www.xero.com/' },
    { name: 'Chaser', url: 'https://chaserhq.com/' }
  ];
  const sales = [
    { name: 'Hubspot', url: 'https://app.hubspot.com/' },
    { name: 'SimilarWeb', url: 'https://secure.similarweb.com/' },
    { name: 'Wiza', url: 'https://wiza.co/' },
    { name: 'Deal Deck', url: 'https://www.dealdeck.ai/' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/' },
    { name: 'Awin', url: 'https://ui.awin.com/' },
    { name: 'Impact', url: 'https://app.impact.com/' },
    { name: 'Rakuten', url: 'https://rakutenadvertising.com/' },
    { name: 'Share a Sale', url: 'https://www.shareasale.com/' },
    { name: 'Pepper Jam / Ascend', url: 'https://id.pepperjam.com/' },
    { name: 'CJ', url: 'https://www.cj.com/' },
    { name: 'Partnerize', url: 'https://partnerize.com/' },
    { name: 'Trade Doubler', url: 'https://www.tradedoubler.com/' },
    { name: 'Flex Offers', url: 'https://www.flexoffers.com/' },
    { name: 'Partner Stack', url: 'https://partnerstack.com/' },
    { name: 'Everflow', url: 'https://www.everflow.io/' },
    { name: 'Foxit', url: 'https://account.foxit.com/' },
    { name: 'Credit Safe', url: 'https://app.creditsafe.com/' }
  ];
  const admin = [
    { name: 'Google Workspace', url: 'https://workspace.google.com/' },
    { name: 'Slack', url: 'https://slack.com/' }
  ];

  const renderList = (items) => (
    <ul>
      {items.map(({ name, url }) => (
        <li key={name}>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#5ec2f7' }}>{name}</a>
        </li>
      ))}
    </ul>
  );

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ color: '#5ec2f7' }}>External Tools</h1>
      <h2>Finance</h2>
      {renderList(finance)}
      <h2>Sales &amp; Account Management</h2>
      {renderList(sales)}
      <h2>Admin</h2>
      {renderList(admin)}
    </div>
  );
}
