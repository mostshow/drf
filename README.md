
Node.js: drf 
=================

Why?
----

Using the program release project can automatically remove redundant version of the document and provide backup, rolled back

Installation
------------

```
    sudo npm i drfile -g

```
Usage
-----
```bash
    drf -h
    Usage: drf drf [source] [destination]  [options] or drf [source]  [--pack || --del-diff]

    Options:

    -h, --help     output usage information
    -V, --version  output the version number
    --compress     Specify the compression way
    --bakdir       Specify the backup directory
    --pack         compressing files
    --unpack       decompressing files
    --del          Delete redundant files automatically
    --del-diff    Delete redundant files
    --bak-name     Specify the backup name

```
