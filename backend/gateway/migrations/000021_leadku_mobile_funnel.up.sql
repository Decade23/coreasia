CREATE UNIQUE INDEX leadku_mobile_events_first_open_once
  ON public.leadku_mobile_events(installation_id) WHERE kind = 'first_open';

CREATE INDEX leadku_mobile_events_funnel_engagement
  ON public.leadku_mobile_events(installation_id, kind)
  WHERE kind IN ('welcome_view', 'demo_started', 'demo_key_action', 'guide_opened', 'guide_completed');

CREATE TABLE public.leadku_signup_handoffs (
  installation_id uuid PRIMARY KEY REFERENCES public.leadku_mobile_installations(id),
  ref uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  from_demo boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  completed_at timestamptz
);

-- Contact data is deliberately outside the installation event stream.
CREATE TABLE public.leadku_setup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id uuid NOT NULL REFERENCES public.leadku_mobile_installations(id),
  contact_channel text NOT NULL CHECK (contact_channel IN ('email', 'whatsapp')),
  contact varchar(254) NOT NULL CHECK (contact <> ''),
  topic text NOT NULL CHECK (topic IN ('pipeline', 'contacts', 'tasks', 'setup')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (installation_id, contact_channel, contact, topic)
);

CREATE INDEX leadku_setup_requests_recent ON public.leadku_setup_requests(created_at DESC, id DESC);
