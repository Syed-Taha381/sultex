# -*- coding: utf-8 -*-
from setuptools import setup, find_packages

with open('requirements.txt') as f:
	install_requires = f.read().strip().split('\n')

# get version from __version__ variable in sultex/__init__.py
from sultex import __version__ as version

setup(
	name='sultex',
	version=version,
	description='Sultex',
	author='Havenir Solutions pvt Limited',
	author_email='info@havenir.com',
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
