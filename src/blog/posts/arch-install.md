---
title: Arch install, the roundabout way!
slug: arch-install
---

I'll preface the motivations/end results for this install. I was using Manjaro
for the past year and was a happy camper, but then I added an SSD to my laptop
and wondered if I could have some more. Greed, eh.

Here's my dream setup:

1. Easy backups and snapshots.
2. Latest software.
3. Access to the AUR or something like it.
4. Lean base to customize as per my need.
5. Keep separate `/ #root` and `/home` partitions but optimize the space use.

I hunted around for a while, EndeavourOS sounded nice at a glance but nothing in
the docs implied it could support a tricky partitioning scheme like I wanted. In
the end I decided to go with the following setup:

- OS: Arch Linux
- Filesystem: btrfs
- Subvolumes: `/ #root` and `/home`
- Snapshots: hourly snapshots of the whole flesystem. 

The final kicker is that I was using my existing Manjaro install and was feeling
extra lazy while enjoying my music. I didn't want to boot into the cli-only Arch
install iso and stay there for hours reading the wiki/internet while I set up my
system. If you're treating this as an install guide for Arch, here's the first step:

**Step 1: Install Manjaro**

I did the whole install below from inside Manjaro while using my existing web browser,
music player, desktop environment, shell, etc. Basically, I never left my comfort zone
and with a downtime of 5 minutes, booted into the new comfort zone. I'd say that's
pretty dang cool and an example of how flexible the tools we have are.

Enjoy the install-notes that I made while doing the install. This post is an after thought, really.

[[toc]]

---

## Preparation

I'm on Manjaro and its, well, mostly Arch, so I'm attempting a setup
where I install Arch from the current Manjaro install itself.

Let's install the latest arch install scripts that the arch iso uses.

    sudo pacman -S arch-install-scripts

Now, the fiddly bits.
pacstrap script depends on a valid pacman mirrorlist being available.
we don't want Arch to install Manjaro packages by accident (OUCH!).

    sudo cp /etc/pacman.d /etc/pacman.d.bak -r
    sudo cp /etc/pacman.conf /etc/pacman.conf.bak

Head over to https://archlinux.org/mirrorlist/ and generate a mirrors list
Let's automate most of it, eh?

    curl https://archlinux.org/mirrorlist/?country=IN&protocol=http&protocol=https&ip_version=4 > /tmp/mirrors-commented
    sed 's/^.//' /tmp/mirrors-commented > /tmp/mirrors

Paste that list over to the actual location

    sudo cp /tmp/mirrors /etc/pacman.d/mirrorlist

Remove Manjaro's certs and generate new keyring for Arch

    sudo rm /etc/pacman.d/gnupg -r
    sudo pacman-key --init
    sudo pacman-key --populate archlinux

Update the packagelist

    sudo pacman -Syy

## Filesystem Setup/Partitioning

The disk has two partitions, both unformatted.

Make the efi partition

    sudo mkfs.fat -F32 /dev/nvme0n1p1

make btrfs partition

    sudo mkfs.btrfs -L main /dev/nvme0n1p2

mount it and go there

    sudo mount /dev/nvme0n1p2 /mnt
    cd /mnt

create subvolumes

    sudo btrfs subvolume create root      # of course
    sudo btrfs subvolume create snapshots # to store snapshots
    sudo btrfs subvolume create home      # basic files
    sudo btrfs subvolume create etc       # for easy backup of config files

unmount

    cd ..
    sudo umount /mnt

----------------------------------------------------------------------
## Mounting the Filesystem

make the filesystem structure

handle /

    sudo mount -o subvol=root /dev/nvme0n1p2 /mnt

handle /home

    sudo mkdir /mnt/home
    sudo mount -o subvol=home /dev/nvme0n1p2 /mnt/home

handle /etc

    sudo mkdir /mnt/etc
    sudo mount -o subvol=etc /dev/nvme0n1p2 /mnt/etc

handle efi partition

    sudo mkdir -p /mnt/boot/efi
    sudo mount /dev/nvme0n1p1 /mnt/boot/efi

mount the whole btrfs volume at /main
this is a cool easy way to access all the subvolumes later.

    sudo mkdir /mnt/main
    sudo mount -o subvol=/ /dev/nvme0n1p2 /mnt/main

Final state after all this (warning, some recursion):

    tree /mnt

```
/mnt
├── boot
│   └── efi
├── etc
├── home
└── main
    ├── etc
    ├── home
    ├── root
    │   ├── boot
    │   │   └── efi
    │   ├── etc
    │   ├── home
    │   └── main
    └── snapshots
```

## Install Arch

We're now going to follow the install guide for a change

Run genfstab (from arch-install-scripts)

    genfstab -U /mnt | sudo tee /mnt/etc/fstab

Read it to see if it matches your expectations.
Note: it picked up my swap from /dev/sda6. I think I'm fine with that for now.
We _could_ remove the UUIDs from here since they aren't exactly needed; let's let it be for now.

We can skip the mirror selection part; we did it in prep phase.

Install important packages.

    sudo pacstrap /mnt base linux linux-firmware btrfs-progs

This refreshed the packagelist (presumably from the actual arch mirrors instead of manjaro's) and
proceeded to install the packages after importing a hell of a lot of pgp keys. Cool!

    ls
    > bin  boot  dev  etc  home  lib  lib64  main  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var

Hmm, looks good.

## Core system setup

    sudo arch-chroot /mnt

Now, we're inside the chroot

Do pacman voodoo again (not doing this gave cert verifiction errors, so I just did it)

    rm /etc/pacman.d/gnupg -r
    pacman-key --init
    pacman-key --populate archlinux

I didn't install vim during pacstrap, so let' do it now. This serves the additional
purpose of checking that pacman is able to install stuff properly.

    pacman -Syu vim

hilariously, checking 'which vim' fails with 'bash: which: command not found'.

set timezone

    ln -sf /usr/share/zoneinfo/Asia/Kolkata /etc/localtime
    hwclock --systohc

set locale

    locale-gen
    echo "LANG=en_US.UTF-8" > /etc/locale.conf

set networking stuff

    echo "rohitt-arch" > /etc/hostname
    cat << EOF >> /etc/hosts
    127.0.0.1	localhost
    ::1		localhost
    127.0.1.1	rohitt-arch.localdomain	rohitt-arch
    EOF

personal pref, nmcli and nmtui are awesome.

    pacman -S networkmanager
    systemctl enable NetworkManager.service

Set a root password

    passwd

We need to enable btrfs on the initramfs image.
#MANUAL INTERVENTION: add 'btrfs' to the hooks in /mnt/etc/mkinitcpio.conf

    vim /etc/mkinitcpio.conf
    mkinitcpio -P

Install grub: https://wiki.archlinux.org/index.php/GRUB#Installation_2

    pacman -S grub efibootmgr

And now configure it

    grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=GRUB
    grub-mkconfig -o /boot/grub/grub.cfg

Enable other OSes to detect Arch

    sudo pacman -S lsb-release


## User account and home directory setup

    pacman -S sudo
    EDITOR=vim visudo # Uncomment the first line that has 'wheel' in it; enables the wheel group
    sudo useradd -m rohitt
    sudo passwd rohitt
    usermod -aG wheel rohit

test it:

    su - rohitt
    sudo ls

yay, didn't get reported to Santa. :)

make common directories

    sudo pacman -S xdg-user-dirs
    xdg-user-dirs-update
    ls
    > Desktop  Documents  Downloads  Music  Pictures  Public  Templates  Videos  tmp

Time for the complex setup.
Let's auto mount the current home directory.

    mkdir ~/data-drive
    cat << EOF | sudo tee -a /etc/fstab
    /dev/sda6
    UUID=b841a4c4-9978-47c9-8d1c-134dabbbc3f6 /home/rohitt/data-drive          ext4    defaults,user,noatime 0 2
    EOF

let's reapply fstab rules

    sudo mount -a

Let's link up some directories.

    rm -r ~/Music
    ln -s ~/data-drive/rohitt/Music ~/Music
    rm -r ~/Pictures
    ln -s ~/data-drive/rohitt/Pictures ~/Pictures
    rm -r ~/Downloads
    ln -s ~/data-drive/rohitt/Downloads ~/Downloads
    rm -r ~/Videos
    ln -s ~/data-drive/rohitt/Videos ~/Videos
    rm -r ~/Desktop
    ln -s ~/data-drive/rohitt/Downloads ~/Downloads
    ln -s ~/data-drive/rohitt/Documents ~/Parchments

## Installing basic tools for a desktop

We're now using the user account. Hello again, sudo.

Let's install an AUR helper

    cd ~
    sudo pacman -S git base-devel
    mkdir tmp
    cd tmp
    git clone https://aur.archlinux.org/yay.git
    cd yay
    makepkg -si
    cd ~
    rm tmp -rf

finally, check it.

    which yay

Microcode for intel

    sudo pacman -S intel-ucode

Driver for integrated GPU

    sudo pacman -S mesa

Driver for nvidia stuff... ugh, might get messy.

    sudo pacman -S nvidia

Looks promising, haha. Famous last words.

Install KDE

    sudo pacman -S plasma-desktop

Install X server and other things using the meta package group

    sudo pacman -S xorg

Make x config

    sudo nvidia-xconfig

Install display manager

    sudo pacman -S sddm sddm-kcm

Install pipewire. It's a new media server, both for video and audio streams. It's
supposed to phase out pulseaudio and jack as well we take part in the webcam and
screen recording game. This is a total experiment; I have no clue how pipewire works.

    sudo pacman -S pipewire pipewire-pulse pipewire-alsa

## Configuring my programs

Let's mount our current home directory.

    cd ~
    mkdir mnt
    sudo mount /dev/sda5 mnt
    sudo chown rohitt mnt

Time to loop over my ~/.config and copy over the good bits.

    ln -s ~/mnt/rohitt/.config conf

beets

    sudo pacman -S beets
    cp -r {conf,.config}/beets

cmus

    sudo pacman -S cmus
    yay -S cmusfm
    cp -r {conf,.config}/cmus

dolphin file browser

    cp -r {conf,.config}/dolphinrc

firefox

    sudo pacman -S firefox
    cp -r mnt/rohitt/.mozilla .mozilla

git

    cp mnt/rohitt/.gitconfig .gitconfig

htop

    sudo pacman -S htop
    cp -r {conf,.config}/htop

kdeconnect

    sudo pacman -S kdeconnect

latte-dock

    sudo pacman -S latte-dock
    cp -r {conf,.config}/latte
    cp -r {conf,.config}/lattedockrc

neovim

    sudo pacman -R vim
    sudo pacman -S neovim
    cp -r {conf,.config}/nvim

ssh

    sudo pacman -S openssh
    cp ~/mnt/rohitt/.ssh . -r

tmux

    sudo pacman -S tmux
    cp mnt/rohitt/.tmux.conf .tmux.conf

watson

    yay -S watson
    cp -r {conf,.config}/watson

yakuake

    cp -r {conf,.config}/yakuakerc
    cp -r {conf,.config}/konsolerc
    mkdir -p ~/.local/share/konsole
    cp -r ~/mnt/rohitt/.local/share/konsole ~/.local/share/konsole

zsh

    sudo pacman -S zsh
    cp mnt/rohitt/.zshrc .zshrc
    cp mnt/rohitt/.zsh_history .zsh_history
    cp -r mnt/rohitt/.oh-my-zsh .oh-my-zsh
    chsh rohitt -s /usr/bin/zsh

## Setting up the dev environment

    sudo pacman -S docker vagrant nodejs atom diff-so-fancy

    sudo systemctl enable docker.service

make a clones folder

    mkdir  -p ~/Documents/clones
    cd ~/Documents/clones

clone zulip

    git clone git@github.com:aero31aero/zulip.git
    cd zulip
    git remote add upstream https://github.com/zulip/zulip

pull in the zuliprc

    cd ~
    cp ~/data-drive/rohitt/zuliprc ~/zuliprc

## Final steps in Manjaro

Bring pacman stuff back to normal

    sudo rm /etc/pacman.d -r
    sudo cp /etc/pacman.d.bak /etc/pacman.d -r
    sudo cp /etc/pacman.conf.bak /etc/pacman.conf

Add Arch to Manjaro's GRUB

    sudo update-grub

Reboot to our new Arch install

    sudo reboot now

## First boot

First, we boot and realize something is off because our booted up system
doesn't have any `/etc` or `/home` etc. Turns out keeping `fstab` in `/etc` and
making the `fstab` mount itself was a bad idea. xD

Reboot into manjaro and mount `/etc` somewhere else, then copy the contents
into Arch's `/etc` and remove the mounting instructions for `/etc` from `fstab`.
While we're at it, let's also remove that `/etc` subvolume.

    sudo btrfs subvolume delete /main/etc


Then, we find out that nvidia's XConfig is broken and we get no graphics.
So, we run:

    sudo Xorg :0 -configure
    sudo systemctl restart sddm.service

This gets us a shitty looking sddm, and we login to our KDE session.
Its shitty, but definitely fast.

Eh, I'd like my familiar pulseaudio back.

    sudo pacman -S pulseaudio
    sudo pacman -R pipewire-alsa

Install some more tools. Really important.

    sudo pacman -S cowsay neofetch

Finally, enable prime:

    sudo pacman -S nvidia-prime

This wasn't *that* big a headache.

Some minor annoyances:
set locale; I'm not sure why my last attempt didn't work.

    echo en_US.UTF-8 UTF-8 > /etc/locale.gen && locale-gen

Restore my KDE config: Latte, plasma themes, icons, lockscreen, splash,
keybindings, dolphin settings and plugins, etc etc etc.
Basically, KDE's configs are so all over the place I got fed up and wrote
a tool to copy it for me: [kde-sane-conf](https://gitlab.com/aero31aero/kde-sane-conf).

    git clone https://gitlab.com/aero31aero/kde-sane-conf
    cd kde-sane-conf
tweak the scripts

    ./backup.sh # backups from my previous partition, here, ~/data-drive which was my last home drive.
    ./restore.sh # restore to my current home partition.

## Futureproofing for mistakes

We know we'll mess this install up eventually, let's futureproof ourselves against it.
The current strategy is to create snapshots (and lots of them) automatically and keep
them around for a reasonable amount of time.

We could do this manually, or as is the idea with this install, automate it.
We have several choices here, but if I were to write a tool out myself, I'd
go towards Snapper. Snapper is written by OpenSUSE and allows taking brtfs
snapshots automatically based on time/system events.

Install snapper

    sudo pacman -S snapper

Create configs for it:
format: sudo snapper -c <config-name> create-config <path-to-btrfs-subvolume>

    sudo snapper -c root create-config /main/root
    sudo snapper -c home create-config /main/home

We just created default configs. Here's what my tweaked version looks like:

    sudoedit /etc/snapper/configs/home
    sudoedit /etc/snapper/configs/root

My final settings:

```
limits for timeline cleanup
TIMELINE_MIN_AGE="1800"
TIMELINE_LIMIT_HOURLY="24"
TIMELINE_LIMIT_DAILY="7"
TIMELINE_LIMIT_WEEKLY="2"
TIMELINE_LIMIT_MONTHLY="1"
TIMELINE_LIMIT_YEARLY="0"
```

I've configured it to keep at max 50 snapshots. This means that if I don't do anything else,
I'd have 24 hourly backups, 7 daily, 2 weekly, 1 monthly and 14 pacman related backups.

Let's enable these things.

    sudo systemctl enable snapper-timeline.timer
    sudo systemctl start snapper-timeline.timer
    sudo systemctl enable snapper-cleanup.timer
    sudo systemctl start snapper-cleanup.timer

Let's do more with these. Install pacman hooks so snapper automatically takes 2 snapshots
(1 before and 1 after) for each run of pacman.

    sudo pacman -S snap-pac

Now, let's make it so these snapshots are automatically picked up by grub so I can
boot from them in case something bad happens.

    yay -S snap-pac-grub

Note: aur packages also trigger these hooks, which is amazing. aur is said to be the
riskiest thingy in the arch universe and I'm now somewhat protected against aur
packages breaking my install accidentally. Malicious actors are still a risk, though.

Finally, let's list our snapshots so far:

    sudo snapper -c root list
    sudo snapper -c home list

---

## Conclusion

BTW, I now use Arch. Finally.

```
$ neofetch
rohitt@rohitt-arch 
------------------ 
OS: Arch Linux x86_64 
Host: HP Pavilion Laptop 15-cc1xx 
Kernel: 5.4.94-1-lts 
Uptime: 6 hours, 16 mins 
Packages: 1244 (pacman) 
Shell: zsh 5.8 
Resolution: 1920x1080, 1920x1080 
DE: Plasma 5.20.5 
WM: KWin 
WM Theme: ChromeOS-dark 
Theme: ChromeOSDark [Plasma], Breeze [GTK2/3] 
Icons: Tela-circle [Plasma], Tela-circle [GTK2/3] 
CPU: Intel i7-8550U (8) @ 4.000GHz 
GPU: Intel UHD Graphics 620 
GPU: NVIDIA GeForce MX130 
Memory: 10168MiB / 15901MiB 
```

Thanks for reading, if you made it so far. I hope this inspires you to customize
your setup to your heart's extent. This was a fun ride for me and a friend
encouraged me to post it here. I learned a lot while doing this experiment, and
I hope you got some cool ideas reading my setup.