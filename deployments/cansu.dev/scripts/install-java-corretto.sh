#!/bin/bash

set -xe

VERSIONS="$1"

for VERSION in $VERSIONS; do
  mkdir -p "/usr/local/java-corretto-$VERSION/bin"
  apt-get update
  apt-get install -y java-common
  curl -fSsL "https://corretto.aws/downloads/latest/amazon-corretto-${VERSION}-x64-linux-jdk.deb" -o /tmp/amazon-corretto-${VERSION}-x64-linux-jdk.deb
  apt-get install -y $(dpkg-deb -f "/tmp/amazon-corretto-${VERSION}-x64-linux-jdk.deb" Depends | sed -e 's/([^)]*)//g' | tr ',' '\n' | tr -d ' ')
  dpkg --fsys-tarfile "/tmp/amazon-corretto-${VERSION}-x64-linux-jdk.deb" | tar -xO ./usr/lib/jvm/java-${VERSION}-amazon-corretto/bin/java > "/tmp/java"
  dpkg --fsys-tarfile "/tmp/amazon-corretto-${VERSION}-x64-linux-jdk.deb" | tar -xO ./usr/lib/jvm/java-${VERSION}-amazon-corretto/bin/javac > "/tmp/javac"
  dpkg --fsys-tarfile "/tmp/amazon-corretto-${VERSION}-x64-linux-jdk.deb" | tar -xO ./usr/lib/jvm/java-${VERSION}-amazon-corretto/bin/jar > "/tmp/jar"
  mv "/tmp/java" "/usr/local/java-corretto-$VERSION/bin/java"
  mv "/tmp/javac" "/usr/local/java-corretto-$VERSION/bin/javac"
  mv "/tmp/jar" "/usr/local/java-corretto-$VERSION/bin/jar"
  chmod +x "/usr/local/java-corretto-$VERSION/bin/java"
  chmod +x "/usr/local/java-corretto-$VERSION/bin/javac"
  chmod +x "/usr/local/java-corretto-$VERSION/bin/jar"
done