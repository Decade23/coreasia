CREATE TABLE public.leadku_mobile_installations (
 id uuid PRIMARY KEY, channel text NOT NULL CHECK(channel IN ('production','uat')),
 app_version varchar(40) NOT NULL, version_code integer NOT NULL CHECK(version_code > 0),
 os_version varchar(40) NOT NULL, first_seen timestamptz NOT NULL DEFAULT now(), last_seen timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leadku_mobile_installations_active ON public.leadku_mobile_installations(channel,last_seen);
CREATE TABLE public.leadku_mobile_events (
 id uuid PRIMARY KEY, installation_id uuid NOT NULL REFERENCES public.leadku_mobile_installations(id),
 kind varchar(32) NOT NULL, screen varchar(32) NOT NULL DEFAULT '', target_code integer,
 recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leadku_mobile_events_time ON public.leadku_mobile_events(recorded_at,kind);
CREATE TABLE public.leadku_mobile_policy (
 channel text PRIMARY KEY CHECK(channel IN ('production','uat')), latest_code integer NOT NULL DEFAULT 0,
 latest_version varchar(40) NOT NULL DEFAULT '', minimum_code integer NOT NULL DEFAULT 0,
 available boolean NOT NULL DEFAULT false, notes varchar(600) NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now(), CHECK(minimum_code >= 0 AND minimum_code <= latest_code)
);
INSERT INTO public.leadku_mobile_policy(channel) VALUES ('production'),('uat');
CREATE TABLE public.leadku_play_daily (
 day date PRIMARY KEY, daily_installs bigint NOT NULL CHECK(daily_installs >= 0),
 daily_uninstalls bigint NOT NULL CHECK(daily_uninstalls >= 0), active_installs bigint, current_installs bigint,
 source_object text NOT NULL, imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.leadku_play_sync (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), last_attempt timestamptz,
 last_success timestamptz, error varchar(200) NOT NULL DEFAULT ''
);
INSERT INTO public.leadku_play_sync(id) VALUES(true);
