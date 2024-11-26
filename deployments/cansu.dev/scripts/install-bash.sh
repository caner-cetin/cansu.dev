#!/bin/bash

VERSIONS="$1"
for VERSION in $VERSIONS; do
  mkdir -p "/usr/local/bash-$VERSION/bin"
  cd /tmp
  curl -fSsL "http://ftp.de.debian.org/debian/pool/main/b/bash/bash_${VERSION}_amd64.deb" -o "/tmp/bash_${VERSION}_amd64.deb"
  apt-get install -y $(dpkg-deb -f "/tmp/bash_${VERSION}_amd64.deb" Depends | sed -e 's/([^)]*)//g' | tr ',' '\n' | tr -d ' ')
  dpkg --fsys-tarfile "/tmp/bash_${VERSION}_amd64.deb" | tar -xO ./usr/bin/bash > "/tmp/bash" 
  mv "/tmp/bash" "/usr/local/bash-${VERSION}/bin/bash"
  chmod +x "/usr/local/bash-${VERSION}/bin/bash"
  rm -rf /tmp/*
done