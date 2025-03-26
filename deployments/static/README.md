configuration files for `https://static.cansu.dev`

### run
```bash
docker compose up -d
```
### ftp setup
```bash
sudo apt-get install vsftpd
sudo mv -f ./vsftpd.conf /etc/vsftpd.conf
sudo chown root:root /etc/vsftpd.conf
sudo systemctl start vsftpd
sudo systemctl enable vsftpd
sudo ufw allow from 194.XX.XX.XXX proto tcp to any port ftp
```