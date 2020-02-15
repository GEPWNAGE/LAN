# LAN

GEPWNAGE LAN Party System

## Components

The LAN party system is divided into the following components:

- The controller, described in [`controller-install.org`](controller-install.org).
- The portal at [GEPWNAGE/lan-portal](https://github.com/GEPWNAGE/lan-portal)
- The intranet at [GEPWNAGE/lan-intranet](https://github.com/GEPWNAGE/lan-intranet)

This repo merely describes the network setup.

## LAN Network Checklist

Checklist of what has to be done for the network setup:

1. Connect the internet to the UniFi USG (internet port)
2. Setup the controller (Note: port LAN 2 of the USG)
3. Connect core switch to the USG (Note: port LAN 1 of the USG)
4. Setup the intranet website / beamer machine
5. Verify the above
6. Install other switches in the room

For detailed information, see the network map in `controller-install.org`.

## UniFi Controller

### Installation

To view more information about the controller, see [`controller-install.org`](controller-install.org)

## Deployment

For deploy, follow installation. Since this doesn't need a lot of database
writing, you will not need something like MySQL. SQLite is good enough (which
the default config uses).

## Authors

* **Pieter Kokx** - *Initial work* - [kokx](https://github.com/kokx)
* **Willem Mouwen** - *Initial work* - [wmouwen](https://github.com/wmouwen)
* **Koen Klaren** - *Intranet* - [Mesoptier](https://github.com/Mesoptier)

See also the list of [contributors](https://github.com/GEPWNAGE/lan/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* **Nicky Gerritsen** - for some help in finding the correct API endpoints
* **#gepwnage** on the GEWIS IRC - for general mental support
