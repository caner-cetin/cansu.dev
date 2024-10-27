#!/bin/bash
# pls credit me if you modify and do something useful with this script
set -e

GCC_7_VERSION=7.4
GCC_8_VERSION=8.3
GCC_9_VERSION=9.3
GCC_10_VERSION=10.2
GCC_11_VERSION=11.5
GCC_12_VERSION=12.4
GCC_13_VERSION=13.3

mkdir -p /tmp/gcc-install
cd /tmp/gcc-install

apt-get update
apt-get install -y curl gpg wget
echo "Installing GCC 7..."
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-7/gcc-7-base_7.4.0-6_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-7/cpp-7_7.4.0-6_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-7/gcc-7_7.4.0-6_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-7/g++-7_7.4.0-6_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-7/libgcc-7-dev_7.4.0-6_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-7/libstdc++-7-dev_7.4.0-6_amd64.deb
echo "Installing GCC 8..."
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-8/gcc-8-base_8.3.0-6_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-8/cpp-8_8.3.0-6_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-8/gcc-8_8.3.0-6_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-8/g++-8_8.3.0-6_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-8/libgcc-8-dev_8.3.0-6_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-8/libstdc++-8-dev_8.3.0-6_amd64.deb
echo "Installing GCC 9..."
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-9/gcc-9-base_9.3.0-22_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-9/cpp-9_9.3.0-22_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-9/gcc-9_9.3.0-22_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-9/g++-9_9.3.0-22_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-9/libgcc-9-dev_9.3.0-22_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-9/libstdc++-9-dev_9.3.0-22_amd64.deb
echo "Installing GCC 10..."
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-10/gcc-10-base_10.2.1-6_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-10/cpp-10_10.2.1-6_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-10/gcc-10_10.2.1-6_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-10/g++-10_10.2.1-6_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-10/libgcc-10-dev_10.2.1-6_amd64.deb
wget http://mirrors.edge.kernel.org/debian/pool/main/g/gcc-10/libstdc++-10-dev_10.2.1-6_amd64.deb
echo "Installing GCC base packages..."
dpkg -i *base*.deb
# https://askubuntu.com/a/170441
wget http://ftp.de.debian.org/debian/pool/main/g/gcc-8/libmpx2_8.3.0-6_amd64.deb      
dpkg -i libmpx2_8.3.0-6_amd64.deb
wget http://ftp.de.debian.org/debian/pool/main/g/gcc-7/libasan4_7.4.0-6_amd64.deb
dpkg -i libasan4_7.4.0-6_amd64.deb
wget http://ftp.de.debian.org/debian/pool/main/g/gcc-9/libasan5_9.3.0-22_amd64.deb    
dpkg -i libasan5_9.3.0-22_amd64.deb 
wget http://ftp.de.debian.org/debian/pool/main/g/gcc-7/libubsan0_7.4.0-6_amd64.deb
dpkg -i libubsan0_7.4.0-6_amd64.deb
wget http://ftp.de.debian.org/debian/pool/main/g/gcc-7/libcilkrts5_7.4.0-6_amd64.deb
dpkg -i libcilkrts5_7.4.0-6_amd64.deb
wget http://ftp.de.debian.org/debian/pool/main/i/isl/libisl19_0.20-2_amd64.deb
dpkg -i libisl19_0.20-2_amd64.deb
echo "Installing GCC library packages..."
dpkg -i libgcc*dev*.deb
dpkg -i libstdc++*dev*.deb
echo "Installing CPP packages..."
dpkg -i cpp*.deb
echo "Installing GCC/G++ packages..."
dpkg -i gcc-[0-9]*.deb
dpkg -i g++-[0-9]*.deb
apt-get install -f -y

echo "Installing newer GCC versions..."
echo "deb http://deb.debian.org/debian testing main" > /etc/apt/sources.list.d/testing.list
apt-get update
apt-get install -y gcc-11 g++-11 gcc-12 g++-12 gcc-13 g++-13 gfortran-13

echo "Creating symlinks..."
mkdir -p /usr/local/gcc-${GCC_7_VERSION}/bin/
mkdir -p /usr/local/gcc-${GCC_8_VERSION}/bin/
mkdir -p /usr/local/gcc-${GCC_9_VERSION}/bin/
mkdir -p /usr/local/gcc-${GCC_10_VERSION}/bin/
mkdir -p /usr/local/gcc-${GCC_11_VERSION}/bin/
mkdir -p /usr/local/gcc-${GCC_12_VERSION}/bin/
mkdir -p /usr/local/gcc-${GCC_13_VERSION}/bin/

ln -sf /usr/bin/gcc-7 /usr/local/gcc-${GCC_7_VERSION}/bin/gcc
ln -sf /usr/bin/g++-7 /usr/local/gcc-${GCC_7_VERSION}/bin/g++
ln -sf /usr/bin/gcc-8 /usr/local/gcc-${GCC_8_VERSION}/bin/gcc
ln -sf /usr/bin/g++-8 /usr/local/gcc-${GCC_8_VERSION}/bin/g++
ln -sf /usr/bin/gcc-9 /usr/local/gcc-${GCC_9_VERSION}/bin/gcc
ln -sf /usr/bin/g++-9 /usr/local/gcc-${GCC_9_VERSION}/bin/g++
ln -sf /usr/bin/gcc-10 /usr/local/gcc-${GCC_10_VERSION}/bin/gcc
ln -sf /usr/bin/g++-10 /usr/local/gcc-${GCC_10_VERSION}/bin/g++
ln -sf /usr/bin/gcc-11 /usr/local/gcc-${GCC_11_VERSION}/bin/gcc
ln -sf /usr/bin/g++-11 /usr/local/gcc-${GCC_11_VERSION}/bin/g++
ln -sf /usr/bin/gcc-12 /usr/local/gcc-${GCC_12_VERSION}/bin/gcc
ln -sf /usr/bin/g++-12 /usr/local/gcc-${GCC_12_VERSION}/bin/g++
ln -sf /usr/bin/gcc-13 /usr/local/gcc-${GCC_13_VERSION}/bin/gcc
ln -sf /usr/bin/g++-13 /usr/local/gcc-${GCC_13_VERSION}/bin/g++
ln -sf /usr/bin/gfortran-13 /usr/local/gcc-${GCC_13_VERSION}/bin/gfortran
ln -sf /usr/bin/gfortran-13 /usr/bin/gfortran

# After installation
for version in 7 8 9 10 11 12 13; do
    if ! command -v g++-${version} &> /dev/null; then
        echo "g++-${version} not found!"
        exit 1
    fi
done

cd /
rm -rf /tmp/gcc-install
apt-get clean
rm -rf /var/lib/apt/lists/*
rm -rf /tmp/*