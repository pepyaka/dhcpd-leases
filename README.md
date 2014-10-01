DHCPD leases
============

This code parse dhcpd.leases file and create table.

You need to change symlink 'dhcpd.leases' to your dhcpd.leases file location:
```
[snatch@mail ~]$ locate dhcpd.leases
/usr/share/man/man5/dhcpd.leases.5.gz
/var/lib/dhcpd/dhcpd.leases
/var/lib/dhcpd/dhcpd.leases~
[snatch@mail ~]$ ln -svf /var/lib/dhcpd/dhcpd.leases .
create symbolic link `./dhcpd.leases' to `/var/lib/dhcpd/dhcpd.leases'
```

And add cloned folder location to http server.
Or just
```
[snatch@mail ~]$  python -m SimpleHTTPServer
Serving HTTP on 0.0.0.0 port 8000 ...
```

And open browser http://hostname:8000
