FROM ofelia-debian
RUN apt-get -y update
RUN apt-get -y install curl
RUN curl -L https://github.com/wal-g/wal-g/releases/download/v3.0.3/wal-g-pg-ubuntu-20.04-amd64.tar.gz -o /tmp/wal-g.tar.gz && \
    tar -zxvf /tmp/wal-g.tar.gz && \
    mv wal-g-pg-ubuntu-20.04-amd64 /usr/local/bin/wal-g && \
    chmod +x /usr/local/bin/wal-g

ENV PATH=/usr/local/bin:$PATH

COPY ./backup/walg.backup.sh /usr/local/bin/walg.backup.sh
RUN chmod +x /usr/local/bin/walg.backup.sh
