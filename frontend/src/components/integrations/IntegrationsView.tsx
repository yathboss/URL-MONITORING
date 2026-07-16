import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAlertChannels } from '../../hooks/useAlertChannels';
import { CardGridSkeleton } from '../ui/Skeleton';
import { AlertChannelType } from '../../types';

interface IntegrationCard {
  name: string;
  detail: string;
  icon: string;
  status: string;
  live: boolean;
  comingSoon?: boolean;
}

export function IntegrationsView() {
  const { channels, isLoading } = useAlertChannels();
  const navigate = useNavigate();

  if (isLoading) return <CardGridSkeleton count={6} />;

  const hasEnabled = (type: AlertChannelType) =>
    channels.some((channel) => channel.channel_type === type && channel.is_enabled);

  const cards: IntegrationCard[] = [
    {
      name: 'Slack',
      detail: 'Rich Block Kit alerts for downtime, recovery, and tests.',
      icon: 'ti-brand-slack',
      status: hasEnabled('SLACK') ? 'Connected' : 'Not connected',
      live: hasEnabled('SLACK'),
    },
    {
      name: 'Email',
      detail: 'Notify inboxes the moment a monitor goes down or recovers.',
      icon: 'ti-mail',
      status: hasEnabled('EMAIL') ? 'Connected' : 'Not connected',
      live: hasEnabled('EMAIL'),
    },
    {
      name: 'Webhook',
      detail: 'Push alert events into any system — custom headers and methods.',
      icon: 'ti-webhook',
      status: hasEnabled('WEBHOOK') ? 'Connected' : 'Available',
      live: hasEnabled('WEBHOOK'),
    },
    {
      name: 'REST API',
      detail: 'Automate monitors, metrics, and reports over the JSON API.',
      icon: 'ti-code',
      status: 'Available',
      live: false,
    },
    {
      name: 'PagerDuty',
      detail: 'Route critical incidents to on-call schedules.',
      icon: 'ti-bell-ringing',
      status: 'Coming soon',
      live: false,
      comingSoon: true,
    },
    {
      name: 'Microsoft Teams',
      detail: 'Notify delivery rooms during degraded states.',
      icon: 'ti-brand-teams',
      status: 'Coming soon',
      live: false,
      comingSoon: true,
    },
  ];

  return (
    <>
      <section className="ops-card-grid">
        {cards.map((card) => (
          <motion.article
            key={card.name}
            className="ops-feature-card"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.18 }}
            style={card.comingSoon ? { opacity: 0.55 } : undefined}
          >
            <div className="ops-feature-icon">
              <i className={`ti ${card.icon}`} aria-hidden="true" />
            </div>
            <span>{card.name}</span>
            <strong style={{ color: card.live ? '#1D9E75' : undefined }}>
              {card.live && <i className="ti ti-circle-check" style={{ marginRight: 6 }} />}
              {card.status}
            </strong>
            <p>{card.detail}</p>
            {!card.comingSoon && card.name !== 'REST API' && (
              <button
                type="button"
                className="ops-ghost-button"
                style={{ marginTop: 10, alignSelf: 'flex-start' }}
                onClick={() => navigate('/alerts')}
              >
                {card.live ? 'Manage in Alerts' : 'Set up in Alerts'}
              </button>
            )}
          </motion.article>
        ))}
      </section>
      <p style={{ marginTop: 16, fontSize: 13, color: '#6B7280' }}>
        Connection status reflects your enabled alert channels — add or toggle channels in the Alerts tab.
      </p>
    </>
  );
}
