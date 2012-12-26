
Using build.sh
==============

You need the following:

* Python 2 (tested with 2.7)
* zsh
* ffmpeg
* uglifyjs


Converting from XLSX to SQL
===========================

You need the following:

* Python 2
* Python modules openpyxl, mysql-python (use pip to install these)

To convert XLSX to SQL, execute:

python2 xlsx2sql.py [excel file] > [sql file]

The result SQL commands can be directly piped into mysql command line, e.g.:

python2 xlsx2sql.py v2.xlsx | mysql -u root -p cs3216_final

where cs3216_final is the database name.



