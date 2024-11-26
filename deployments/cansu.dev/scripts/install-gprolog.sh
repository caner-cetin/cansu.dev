#!/bin/bash

set -xe 
VERSIONS="$1"
for VERSION in $VERSIONS; do
  mkdir -p "/usr/local/gprolog-$VERSION/bin"
  cd /tmp
  curl -fSsl "http://ftp.de.debian.org/debian/pool/main/g/gprolog/gprolog_${VERSION}_amd64.deb" -o "/tmp/gprolog_${VERSION}_amd64.deb"
  apt-get install -y $(dpkg-deb -f "/tmp/gprolog_${VERSION}_amd64.deb" Depends | sed -e 's/([^)]*)//g' | tr ',' '\n' | tr -d ' ')
  dpkg --fsys-tarfile "/tmp/gprolog_${VERSION}_amd64.deb" | tar -xO ./usr/lib/gprolog/bin/gprolog > "/tmp/gprolog"
  dpkg --fsys-tarfile "/tmp/gprolog_${VERSION}_amd64.deb" | tar -xO ./usr/lib/gprolog/bin/gplc > "/tmp/gplc"
  mv "/tmp/gprolog" "/usr/local/gprolog-$VERSION/bin/gprolog"
  mv "/tmp/gplc" "/usr/local/gprolog-$VERSION/bin/gplc"
  chmod +x "/usr/local/gprolog-$VERSION/bin/gprolog"
  chmod +x "/usr/local/gprolog-$VERSION/bin/gplc"
done;