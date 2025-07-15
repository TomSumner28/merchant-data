export default function ExternalTools() {
  const finance = [
    { name: 'Xero', url: 'https://www.xero.com/' },
    { name: 'Chaser', url: 'https://chaserhq.com/' }
  ];
  const sales = [
    { name: 'HubSpot', url: 'https://app.hubspot.com/' }
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
