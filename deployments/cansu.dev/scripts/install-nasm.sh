# install-nasm.sh
#!/bin/bash
set -xe

VERSIONS="$1"

for VERSION in $VERSIONS; do
    mkdir -p "/usr/local/nasm-$VERSION/bin"
    curl -fSsL "http://ftp.de.debian.org/debian/pool/main/n/nasm/nasm_${VERSION}_amd64.deb" -o "/tmp/nasm_${VERSION}_amd64.deb"
    apt-get install -y $(dpkg-deb -f "/tmp/nasm_${VERSION}_amd64.deb" Depends | sed -e 's/([^)]*)//g' | tr ',' '\n' | tr -d ' ')
    dpkg --fsys-tarfile "/tmp/nasm_${VERSION}_amd64.deb" | tar -xO ./usr/bin/nasm > "/tmp/nasm"
    mv "/tmp/nasm" "/usr/local/nasm-$VERSION/bin/nasm"
    chmod +x "/usr/local/nasm-$VERSION/bin/nasm"
    rm -rf /tmp/*
done