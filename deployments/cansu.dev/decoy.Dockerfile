# decoy file with go compiler to test playground backend
FROM debian:sid-slim
RUN apt-get update 
RUN apt-get install -y --no-install-recommends \
  gnupg2 \
  python3-launchpadlib \
  software-properties-common \
  curl \
  git \
  build-essential \
  unzip \
  autoconf \
  libssl-dev \
  libssh-dev \
  libreadline-dev \
  libasan6 \
  zlib1g-dev \
  libzstd-dev \
  libncurses5-dev \
  libffi-dev \
  libgdbm-dev \
  libdb-dev \
  libpcre2-dev \
  libgmp-dev \
  libtinfo6 \
  libtsan0 \
  libxml2-utils \
  libcap-dev \
  libtool \
  gettext \
  make \ 
  git \
  unixodbc-dev \
  xsltproc \
  fop \
  bison \
  rlwrap \
  re2c \
  locales \
  jq \
  m4 \
  && rm -rf /var/lib/apt/lists/*

RUN ln -s /lib/x86_64-linux-gnu/libtinfo.so.6 /usr/lib/libtinfo.so.5
RUN echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && locale-gen
ENV LANG=en_US.UTF-8 LANGUAGE=en_US:en LC_ALL=en_US.UTF-8

ENV ASDF_VERSION=0.14.1
RUN git clone https://github.com/asdf-vm/asdf.git /usr/local/.asdf --branch v${ASDF_VERSION}
ENV ASDF_DATA_DIR=/usr/local/.asdf
ENV PATH="/usr/local/.asdf/bin:/usr/local/.asdf/shims:$PATH"
RUN echo '. /usr/local/.asdf/asdf.sh' >> ~/.bashrc && \
  echo '. /usr/local/.asdf/completions/asdf.bash' >> ~/.bashrc

RUN asdf plugin-add golang  https://github.com/asdf-community/asdf-golang.git
ENV GOLANG_VERSION=1.23.2
RUN asdf install golang ${GOLANG_VERSION} && \
  asdf global golang ${GOLANG_VERSION} && \
  asdf reshim golang ${GOLANG_VERSION}