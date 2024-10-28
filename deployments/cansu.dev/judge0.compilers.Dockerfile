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

COPY install-gcc.sh /tmp/install-gcc.sh
RUN chmod +x /tmp/install-gcc.sh && /tmp/install-gcc.sh

RUN set -xe && \
  apt-get update && \
  apt-get install -y --no-install-recommends clang-19 gnustep-devel && \
  rm -rf /var/lib/apt/lists/* && \
  ln -sf /usr/bin/clang-19 /usr/local/bin/clang-19


ENV BASH_VERSION="5.2.37"
RUN set -xe && \
  curl -fSsL "https://ftpmirror.gnu.org/bash/bash-${BASH_VERSION}.tar.gz" -o /tmp/bash-${BASH_VERSION}.tar.gz && \
  mkdir /tmp/bash-${BASH_VERSION} && \
  tar -xf /tmp/bash-${BASH_VERSION}.tar.gz -C /tmp/bash-${BASH_VERSION} --strip-components=1 && \
  rm /tmp/bash-${BASH_VERSION}.tar.gz && \
  cd /tmp/bash-${BASH_VERSION} && \
  ./configure --prefix=/usr/local/bash-${BASH_VERSION} && \
  make -j$(nproc) && \
  make -j$(nproc) install && \
  rm -rf /tmp/*

ENV FBC_VERSION="1.10.1"
RUN set -xe && \
  curl -fSsL "https://downloads.sourceforge.net/project/fbc/FreeBASIC-${FBC_VERSION}/Binaries-Linux/FreeBASIC-${FBC_VERSION}-linux-x86_64.tar.gz" -o /tmp/fbc-${FBC_VERSION}.tar.gz && \
  mkdir /usr/local/fbc-${FBC_VERSION} && \
  tar -xf /tmp/fbc-${FBC_VERSION}.tar.gz -C /usr/local/fbc-${FBC_VERSION} --strip-components=1 && \
  rm -rf /tmp/*

RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF && \
  echo "deb https://download.mono-project.com/repo/ubuntu stable-focal main" | tee /etc/apt/sources.list.d/mono-official-stable.list && \
  apt-get update && \
  apt-get install -y mono-complete mono-vbnc && \
  rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
  apt-get install -y --no-install-recommends clang gnustep-devel && \
  rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
  apt-get install -y --no-install-recommends sqlite3 && \
  rm -rf /var/lib/apt/lists/*

RUN curl -fSsL "https://download.java.net/java/GA/jdk23.0.1/c28985cbf10d4e648e4004050f8781aa/11/GPL/openjdk-23.0.1_linux-x64_bin.tar.gz" -o /tmp/openjdk23.tar.gz && \
  mkdir /usr/local/openjdk23 && \
  tar -xf /tmp/openjdk23.tar.gz -C /usr/local/openjdk23 --strip-components=1 && \
  rm /tmp/openjdk23.tar.gz && \
  ln -s /usr/local/openjdk23/bin/javac /usr/local/bin/javac && \
  ln -s /usr/local/openjdk23/bin/java /usr/local/bin/java && \
  ln -s /usr/local/openjdk23/bin/jar /usr/local/bin/jar

RUN set -xe && \
  apt-get update && \
  apt-get install -y --no-install-recommends \
  ocaml \
  opam \
  && rm -rf /var/lib/apt/lists/*

# Set versions as environment variables
ENV OCTAVE_VERSION=9.2.0
RUN set -xe \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  octave \
  && mkdir -p /usr/local/octave-${OCTAVE_VERSION}/bin \
  && ln -s /usr/bin/octave /usr/local/octave-${OCTAVE_VERSION}/bin/octave \
  && ln -s /usr/bin/octave-cli /usr/local/octave-${OCTAVE_VERSION}/bin/octave-cli
ENV PATH="/usr/local/octave-${OCTAVE_VERSION}/bin:$PATH"

ENV GPROLOG_VERSION=1.5.0
RUN set -xe \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  gprolog \
  # Create version-specific directory and symlinks
  && mkdir -p /usr/local/gprolog-${GPROLOG_VERSION}/bin \
  && ln -s /usr/lib/gprolog/bin/gplc /usr/local/gprolog-${GPROLOG_VERSION}/bin/gplc \
  && ln -s /usr/lib/gprolog/bin/gprolog /usr/local/gprolog-${GPROLOG_VERSION}/bin/gprolog
ENV PATH="/usr/local/gprolog-${GPROLOG_VERSION}/bin:$PATH"

ENV FPC_VERSION=3.2.2 
RUN apt-get install -y --no-install-recommends fpc-3.2.2  && \
  mkdir -p /usr/local/fpc-${FPC_VERSION}/bin && \
  ln -s /usr/bin/x86_64-linux-gnu-fpc-3.2.2 /usr/local/fpc-${FPC_VERSION}/bin/fpc
ENV PATH="/usr/local/fpc-${FPC_VERSION}/bin:$PATH"

ENV COBOL_VERSION=3.1.2 
RUN set -xe \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  gnucobol3 \
  # Create version-specific directory and symlinks
  && mkdir -p /usr/local/gnucobol-${COBOL_VERSION}/bin \
  && ln -s /usr/bin/cobc /usr/local/gnucobol-${COBOL_VERSION}/bin/cobc \
  && ln -s /usr/bin/cobcrun /usr/local/gnucobol-${COBOL_VERSION}/bin/cobcrun
ENV PATH="/usr/local/gnucobol-${COBOL_VERSION}/bin:$PATH"

RUN set -xe && \
  apt-get update && \
  apt-get install -y --no-install-recommends \
  ruby 

RUN apt-get update && apt-get install -y libxml2-dev libsqlite3-dev libcurl4-openssl-dev libgd-dev libonig-dev libzip-dev libpq-dev libmysql++-dev
ENV PHP_VERSIONS \
  8.3.13
RUN set -xe && \
  apt-get update && \
  apt-get install -y --no-install-recommends bison re2c && \
  rm -rf /var/lib/apt/lists/* && \
  for VERSION in $PHP_VERSIONS; do \
  curl -fSsL "https://codeload.github.com/php/php-src/tar.gz/php-$VERSION" -o /tmp/php-$VERSION.tar.gz && \
  mkdir /tmp/php-$VERSION && \
  tar -xf /tmp/php-$VERSION.tar.gz -C /tmp/php-$VERSION --strip-components=1 && \
  rm /tmp/php-$VERSION.tar.gz && \
  cd /tmp/php-$VERSION && \
  ./buildconf --force && \
  ./configure \
  --prefix=/usr/local/php-$VERSION && \
  make -j$(nproc) && \
  make -j$(nproc) install && \
  rm -rf /tmp/*; \
  done

ENV R_VERSIONS \
  4.4.1
RUN set -xe && \
  apt-get update && \
  apt-get install -y --no-install-recommends libpcre2-dev && \
  rm -rf /var/lib/apt/lists/* && \
  for VERSION in $R_VERSIONS; do \
  curl -fSsL "https://cloud.r-project.org/src/base/R-4/R-$VERSION.tar.gz" -o /tmp/r-$VERSION.tar.gz && \
  mkdir /tmp/r-$VERSION && \
  tar -xf /tmp/r-$VERSION.tar.gz -C /tmp/r-$VERSION --strip-components=1 && \
  rm /tmp/r-$VERSION.tar.gz && \
  cd /tmp/r-$VERSION && \
  ./configure --with-x=no \
  --prefix=/usr/local/r-$VERSION && \
  make -j$(nproc) && \
  make -j$(nproc) install && \
  rm -rf /tmp/*; \
  done

ENV NASM_VERSIONS \
  2.16.03
RUN set -xe && \
  for VERSION in $NASM_VERSIONS; do \
  curl -fSsL "https://www.nasm.us/pub/nasm/releasebuilds/$VERSION/nasm-$VERSION.tar.gz" -o /tmp/nasm-$VERSION.tar.gz && \
  mkdir /tmp/nasm-$VERSION && \
  tar -xf /tmp/nasm-$VERSION.tar.gz -C /tmp/nasm-$VERSION --strip-components=1 && \
  rm /tmp/nasm-$VERSION.tar.gz && \
  cd /tmp/nasm-$VERSION && \
  ./configure \
  --prefix=/usr/local/nasm-$VERSION && \
  make -j$(nproc) nasm ndisasm && \
  make -j$(nproc) strip && \
  make -j$(nproc) install && \
  echo "/usr/local/nasm-$VERSION/bin/nasm -o main.o \$@ && ld main.o" >> /usr/local/nasm-$VERSION/bin/nasmld && \
  chmod +x /usr/local/nasm-$VERSION/bin/nasmld && \
  rm -rf /tmp/*; \
  done

ENV SWIFT_VERSIONS \
  6.0.1
RUN set -xe && \
  rm -rf /var/lib/apt/lists/* && \
  for VERSION in $SWIFT_VERSIONS; do \
  curl -fSsL "https://download.swift.org/swift-${VERSION}-release/debian12/swift-${VERSION}-RELEASE/swift-${VERSION}-RELEASE-debian12.tar.gz" -o /tmp/swift-$VERSION.tar.gz && \
  mkdir /usr/local/swift-$VERSION && \
  tar -xf /tmp/swift-$VERSION.tar.gz -C /usr/local/swift-$VERSION --strip-components=2 && \
  rm -rf /tmp/*; \
  done


RUN set -xe && \
  curl -fSsL "https://dlcdn.apache.org/groovy/4.0.23/distribution/apache-groovy-binary-4.0.23.zip" -o /tmp/groovy.zip && \
  unzip /tmp/groovy.zip -d /usr/local && \
  rm -rf /tmp/*

ENV SCALA_VERSION=3.5.2
RUN curl -fSsL "https://github.com/scala/scala3/releases/download/${SCALA_VERSION}/scala3-${SCALA_VERSION}-x86_64-pc-linux.tar.gz" -o /tmp/scala3-3.5.2-x86_64-pc-linux.tar.gz && \
  mkdir /usr/local/scala-${SCALA_VERSION} && \
  tar -xf /tmp/scala3-${SCALA_VERSION}-x86_64-pc-linux.tar.gz -C /usr/local/scala-${SCALA_VERSION} --strip-components=1

RUN curl -L -O https://github.com/clojure/brew-install/releases/latest/download/linux-install.sh && \
  chmod +x linux-install.sh && \
  ./linux-install.sh

# Clean up
RUN apt-get clean \
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /tmp/*

ENV ASDF_VERSION=0.14.1
RUN git clone https://github.com/asdf-vm/asdf.git /usr/local/.asdf --branch v${ASDF_VERSION}
ENV ASDF_DATA_DIR=/usr/local/.asdf
ENV PATH="/usr/local/.asdf/bin:/usr/local/.asdf/shims:$PATH"
RUN echo '. /usr/local/.asdf/asdf.sh' >> ~/.bashrc && \
  echo '. /usr/local/.asdf/completions/asdf.bash' >> ~/.bashrc

RUN asdf plugin-add python  https://github.com/asdf-community/asdf-python.git   && \
  asdf plugin-add golang  https://github.com/asdf-community/asdf-golang.git   && \
  asdf plugin-add erlang  https://github.com/asdf-vm/asdf-erlang.git          && \
  asdf plugin-add elixir  https://github.com/asdf-vm/asdf-elixir.git          && \
  asdf plugin-add kotlin  https://github.com/asdf-community/asdf-kotlin.git   && \
  asdf plugin-add sbcl    https://github.com/smashedtoatoms/asdf-sbcl.git     && \
  asdf plugin-add dmd     https://github.com/sylph01/asdf-dmd.git             && \
  asdf plugin-add haskell https://github.com/vic/asdf-haskell.git             && \
  asdf plugin-add bun     https://github.com/cometkim/asdf-bun                && \
  asdf plugin-add lua     https://github.com/Stratus3D/asdf-lua.git           && \
  asdf plugin-add rust    https://github.com/code-lever/asdf-rust.git         && \
  asdf plugin-add perl    https://github.com/ouest/asdf-perl.git              && \
  asdf plugin-add dotnet  https://github.com/hensou/asdf-dotnet               && \
  asdf plugin-add groovy  https://github.com/weibemoura/asdf-groovy.git       && \
  asdf plugin-add julia   https://github.com/rkyleg/asdf-julia.git            && \
  asdf plugin add nim     https://github.com/asdf-community/asdf-nim        


# ctrl f is your friend
ENV PYTHON3_VERSION=3.12.7
RUN asdf install python ${PYTHON3_VERSION} && \
  asdf reshim python ${PYTHON3_VERSION}

ENV PYTHON2_VERSION=2.7.17
RUN asdf install python ${PYTHON2_VERSION} && \
  asdf reshim python ${PYTHON2_VERSION}

RUN asdf global python ${PYTHON2_VERSION} ${PYTHON3_VERSION}

ENV GOLANG_VERSION=1.23.2
RUN asdf install golang ${GOLANG_VERSION} && \
  asdf global golang ${GOLANG_VERSION} && \
  asdf reshim golang ${GOLANG_VERSION}

ENV RUST_VERSION=1.82.0
RUN asdf install rust ${RUST_VERSION} && \
  asdf global rust ${RUST_VERSION} && \
  asdf reshim rust ${RUST_VERSION}

ENV ERLANG_VERSION=27.1.2
RUN asdf install erlang ${ERLANG_VERSION} && \
  asdf global erlang ${ERLANG_VERSION} && \
  asdf reshim erlang ${ERLANG_VERSION}

ENV ELIXIR_VERSION=1.17.3
RUN asdf install elixir ${ELIXIR_VERSION} && \
  asdf global elixir ${ELIXIR_VERSION} && \
  asdf reshim elixir ${ELIXIR_VERSION}

ENV KOTLIN_VERSION=2.0.21
RUN asdf install kotlin ${KOTLIN_VERSION} && \
  asdf global kotlin ${KOTLIN_VERSION} && \
  asdf reshim kotlin ${KOTLIN_VERSION}

ENV LUA_VERSION=5.4.7
RUN asdf install lua ${LUA_VERSION} && \
  asdf global lua ${LUA_VERSION} && \
  asdf reshim lua ${LUA_VERSION}

ENV SBCL_VERSION=2.4.9
RUN asdf install sbcl ${SBCL_VERSION} && \
  asdf global sbcl ${SBCL_VERSION} && \
  asdf reshim sbcl ${SBCL_VERSION}

ENV DMD_VERSION=2.109.1
RUN asdf install dmd ${DMD_VERSION} && \
  asdf global dmd ${DMD_VERSION} && \
  asdf reshim dmd ${DMD_VERSION}

ENV HASKELL_VERSION=7.8.4
RUN asdf install haskell ${HASKELL_VERSION} && \
  asdf global haskell ${HASKELL_VERSION} && \
  asdf reshim haskell ${HASKELL_VERSION}

ENV BUN_VERSION=1.1.33
RUN asdf install bun ${BUN_VERSION} && \
  asdf global bun ${BUN_VERSION} && \
  asdf reshim bun ${BUN_VERSION}

ENV PERL_VERSION=5.40.0
RUN asdf install perl ${PERL_VERSION} && \
  asdf global perl ${PERL_VERSION} && \
  asdf reshim perl ${PERL_VERSION}

ENV DOTNET_VERSION=8.0.403 
RUN asdf install dotnet ${DOTNET_VERSION} && \
  asdf global dotnet ${DOTNET_VERSION} && \
  asdf reshim dotnet ${DOTNET_VERSION}

ENV JULIA_VERSION=1.11.1
RUN asdf install julia ${JULIA_VERSION} && \
  asdf global julia ${JULIA_VERSION} && \
  asdf reshim julia ${JULIA_VERSION}

ENV NIM_VERSION=2.2.0
RUN asdf install nim ${NIM_VERSION} && \
  asdf global nim ${NIM_VERSION} && \
  asdf reshim nim ${NIM_VERSION}


# Python packages 
# RUN python3.12 -m pip install numpy pandas matplotlib seaborn scikit-learn

# Install isolate
RUN set -xe && \
  apt-get update && \
  apt-get install -y --no-install-recommends git libcap-dev && \
  rm -rf /var/lib/apt/lists/* && \
  git clone https://github.com/judge0/isolate.git /tmp/isolate && \
  cd /tmp/isolate && \
  git checkout ad39cc4d0fbb577fb545910095c9da5ef8fc9a1a && \
  make -j$(nproc) install && \
  rm -rf /tmp/*

ENV BOX_ROOT /var/local/lib/isolate

LABEL maintainer="Herman Zvonimir Došilović <hermanz.dosilovic@gmail.com>"
LABEL updated="Caner Cetin <hello@cansu.dev>"
LABEL version="1.4.0"

# Destined as the servant to the night where your moon dreams of the dirt
# And the sharp tongue of your zealous will is only congruent with the salt
# In your mouth and the approaching eulogy of the world.
# Lost in the patterns of youth and the ghost of your aches comes back to haunt you.
# And the forging of change makes no difference.
# Memories fly through the mask of your life shielding you from time.
# The years that birthed the shell that you gained.
# Hunched over in apathetic grief with a disregard for steps except the one taken back.
# Perched up on a rope crafted in smoke, a sword wielding death that buried your hope.
# Focusing on light through the blinds, a slave to reality under a monarch in the sky.
# Lost in the patterns of youth where the windows shine brightly back at you.