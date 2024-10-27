FROM judge0-compilers:latest as production

ENV JUDGE0_HOMEPAGE="https://judge0.com"
LABEL homepage=$JUDGE0_HOMEPAGE
ENV JUDGE0_SOURCE_CODE="https://github.com/judge0/judge0"
LABEL source_code=$JUDGE0_SOURCE_CODE
ENV JUDGE0_MAINTAINER="Herman Zvonimir Došilović <hermanz.dosilovic@gmail.com>"
LABEL maintainer=$JUDGE0_MAINTAINER
# and ofc me for updating hehe

ENV ASDF_DATA_DIR=/usr/local/.asdf
ENV PATH="/usr/local/.asdf/bin:/usr/local/.asdf/shims:/opt/.gem/bin:$PATH"
ENV GEM_HOME="/opt/.gem/"


RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  cron \
  libpq-dev \
  ruby-dev \
  sudo \
  build-essential \
  libffi-dev \
  ruby-full \
  ruby-bundler \
  postgresql \
  postgresql-contrib \
  libpq-dev && \
  rm -rf /var/lib/apt/lists/* && \
  echo "gem: --no-document" > /root/.gemrc && \
  gem install bundler:2.1.4

RUN apt-get install ruby-dev
RUN useradd -u 1000 -m -r judge0 && \
  echo "judge0 ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers && \
  mkdir -p /opt/.gem && \
  chown -R judge0:judge0 /opt/.gem

EXPOSE 2358
WORKDIR /api

COPY Gemfile* ./
RUN RAILS_ENV=production bundle

USER root
COPY cron /etc/cron.d
RUN cat /etc/cron.d/* | crontab -
COPY --chown=judge0:judge0 . .
RUN chown -R judge0:judge0 /api/tmp/

USER judge0
RUN asdf global kotlin 2.0.21
ENTRYPOINT ["/api/docker-entrypoint.sh"]
CMD ["/api/scripts/server"]

ENV JUDGE0_VERSION="1.13.1"
LABEL version=$JUDGE0_VERSION

FROM production AS development
CMD ["sleep", "infinity"]