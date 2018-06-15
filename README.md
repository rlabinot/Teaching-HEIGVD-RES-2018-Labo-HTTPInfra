# Teaching-HEIGVD-RES-2018-Labo-HTTPInfra

Authors : Labinot Rashiti & Romain Gallay

## Introduction

During the RES training in HEIG-VD, we have to do a big lab called HTTPInfra. It summaries much of the knowledge we learned in this course during the semester.

This lab is to get familiar with Javascript, Docker, PHP, bootstrap and npm. All these softwares are used to get a nice HTTP Infrastucture. 

## Step 1 : Static HTTP server with apache httpd

By looking at the webcast, first step of the lab is in the fb-apache-static branch. The goal of this step is to make an apache HTTP server in a Docker container and run a static HTML website in it.

Firstly we download an Apache server already containing a PHP version. Then we search for a template in the Boostrap official website as explain in the webcast. Theses templates are ready to use so we just copy the content folder in the right image folder.

To make a docker container, we need a Dockerfile which will look like this :

```
FROM php:7.0-apache

COPY content/ /var/www/html/
```

This means that we will copy the Boostrap website "content" in the default folder for web content. After this, we can already test our work by typing these commands in a docker terminal :

````docker build -t res/apache_php . 
docker build -t res/apache_php . 
docker run -p 9090:80 res/apache_php
````

First line, we create the container, second line we run it and match the port 80 of the dockerized apache server with our local port 9090. Then we just have to look at the IP 192.168.99.100:9090 to see the website.

## Step 2: Dynamic HTTP server with express.js

This second part refers to the branch fb-express-dynamic as seen in the webcast. In this step, we will have to write an API that will randomly return Json data using Node.js. 

To make this little script, we use the npm libraries chance (gives random numbers) and express (helps us making network request easily). Our script will return addresses and not students. You have the code in the git repo to check this out.

This little application has to be dockerized, so as with every container and Docker image, we write its Dockerfile :

``` 
FROM node:4.4
COPY src /opt/app
CMD["node", "opt/app/index.js"]
```

The Dockerfile isn't too big, it simply copies the script in the src folder and runs it in the container with the CMD command. It is important not to forget to init the modules with npm. Because the script uses external libraries, we have to be warned about dependancy problems...

That's why we have to do a quick "npm init" to create the package.json and then a "npm install --save chance express" to install chance and express libraries. Don't forget, this has to be done before the creation of the Docker image.

After that, we can use the script as a docker container. We have to execute these commands as said in the webcast :

```
docker build -t res/express_addresses
docker run -p 9091:3000 res/express_addresses
```

You can check the result in 192.168.99.100:9091 to get addresses lists.

## Step 3: Reverse proxy with apache (static configuration)

This part of the lab is done in the fb-apache-reverse-proxy branch.

In this part, we will have to add a reverse proxy in our HTTP infrastructure. It means that we want only one entry point to access multiple content of our infrastructure. For example, we can access the static website or the little application that give addresses.

By chance, Apache2 has a proxy module given. This module contains the file 000-default. We copied this file with the new name 001-reverse-proxy.conf and with the following content :

```
<VirtualHost *:80>
	ServerName demo.res.ch
	
	#ErrorLog ${APACHE_LOG_DIR}/error.log
	#CustomLog ${APACHE_LOG_DIR}/access.log combined
	
	ProxyPass "/api/addresses/" "http://172.17.0.3:3000/"
	ProxyPassReverse "/api/addresses/" "http://172.17.0.3:3000/"

	ProxyPass "/" "http://172.17.0.2:80/"
	ProxyPassReverse "/" "http://172.17.0.2:80/"	
</VirtualHost>
```

This configuration will map the entry "/" to the static website and the entry "/api/addresses/" to the little node.js application.

Be careful, this file contains hard coded IP which is not a good idea because Docker assigns random IPs. Your static website IP or express application IP may not match the hard coded IP, in which case it won't work. This problem will be fixed in the next step. For the moment, in the webcast, we will juste use this.

````
FROM php:5.6-apache

COPY conf/ /etc/apache2

RUN a2enmod proxy proxy_http
RUN a2ensite 000-* 001-*
````

Don't forget this Dockerfile to get create our first proxy Apache server. Theses commands are here to copy the current conf (which contains the 001-reverse-proxy.conf) into the Apache container and enable the proxy mode with the RUN command. 

By the way, for the next tests, you have to configure your host file to redirect the name demo.res.ch to 192.168.99.100. It will be easier to test this.

For the test, you have to be very careful. We have a static IP for our 001-reverse-proxy.conf so we have to do things properly to have exactly the same IP range for the containers. First be sure not to have any container running and then type theses commands :

```
docker build -t res/apache_php ./apache-php-image/
docker build -t res/express_students ./express-image/
docker build -t res/apache_rp ./apache-reverse-proxy/

docker run -d res/apache_php 
docker run -d res/express_students 
docker run -p 8080:80 res/apache_rp
```

The first three commands create the Docker Images. The last three commands create the containers. Normally the first container should have the IP 172.17.0.2 and the second 172.17.0.3.

To check if the HTTP infrastructure is working you have to go to : 

- demo.res.ch:8080 for the static website
- demo.res.ch:8080/api/addresses for the express application (don't forget the / in the end)

## Step 4: AJAX requests with JQuery

This step is on the branch fb-ajax-query. 

The first thing we have to do in every Dockerfile is to update the software catalog and install vim. By default, containers don't have vim installed and it is very useful to edit configuration files.

```
RUN apt-get update && \
	apt-get install -y vim
```

Now, we want to add the dynamic app in our website. To do this, we have to edit the index.html file in the website content and add this line in the script part of the website :

```
	<!-- My RES Script -->
	<script src="vendor/jquery/addresses.js"></script>
```

Our website template scripts are in the "jquery" folder so don't forget to put the script in the folder.

```
$(function() {
	console.log("Loading addresses");
	
     	function loadAddresses() {
		$.getJSON( "/api/addresses/", function( addresses ) {
			console.log(addresses);
			var message = "Nobody is here";
			if (addresses.length > 0) {
				message = addresses[0].address + " " + addresses[0].phone + " " + addresses[0].city + " " + addresses[0].country;
			}
			$(".skills").text(message);
		});
   	 };

	loadAddresses();
	setInterval(loadAddresses,2000);
});
```

This script will load some adresses every 2 seconds and show them in a HTML element wich has a "skills" CSS class. This means we have to add the "skills" class in an HTML element in the website template. We chose to add it in the nav bar to see it more clearly.

```
    <!-- Navigation -->
    <nav class="navbar navbar-light bg-light static-top">
      <div class="container">
        <a class="skills" href="#">Start Bootstrap</a>
        <a class="btn btn-primary" href="#">Sign In</a>
      </div>
    </nav>
```

To test this, don't forget that the IP addresses are still hard coded so be sure to have the correct IP for the correct container !

## Step 5: Dynamic reverse proxy configuration

This step is on branch fb-dynamic-configuration.

This is the step where we will remove theses hard coded IPs and make an better implementation of our HTTPInfra. The goal here is to give the IPs to the container Apache_rp with the '-e' option with the right IP.

To do this, we use an file called apache2-foreground taken from this repo :

````
https://github.com/docker-library/php/blob/master/7.0/stretch/apache/apache2-foreground
````

This file must be in /usr/local/bin from the Apache_rp container so just add the line "COPY apache2-foreground /usr/local/bin/" in the apache-reverse-proxy Dockerfile.

Then we create a file called config-template.php with the following content :

````
<?php 
	$dynamic_app = getenv('DYNAMIC_APP');
	$static_app = getenv('STATIC_APP');
?>

<VirtualHost *:80>
	ServerName demo.res.ch
	
	#ErrorLog ${APACHE_LOG_DIR}/error.log
	#CustomLog ${APACHE_LOG_DIR}/access.log combined
	
	ProxyPass '/api/addresses/' 'http://<?php print "$dynamic_app"?>/'
	ProxyPassReverse '/api/addresses/' 'http://<?php print "$dynamic_app"?>/'

	ProxyPass '/' 'http://<?php print "$static_app"?>/'
	ProxyPassReverse '/' 'http://<?php print "$static_app"?>/'	
</VirtualHost>
````

The dynamic_app and static_app variables will take the value given from the option '-e'. We just need to be cautious when we write "DYNAMIC_APP=172.17.0.X" for example because case sensitive is important. This file must be in the templates folder for Apache so we just add this line in the Dockerfile "COPY templates /var/apache2/templates" and rebuild the Apache reverse image.

Now we can test it ! Create some containers to diversify the IP address range. Create and name one apache_php container and one express_dynamic container. Look at their IP address with the command :

````
docker inspect DockerNameID | grep -i ipaddress
````

Then use their IPs to launch the Apache reverse with the command : 

````
docker run -d -p 8080:80 -e STATIC_APP=IPOfApache_php:80 -e DYNAMIC_APP=IPOfExpress_dynamic:3000  --name apache_rp res/apache_rp
````

And it is done !

## Step 6: UI Management

For this step, we chose to use Portainer which is a simple management UI for Docker, c.f https://portainer.io/

First we have to create a volume "portainer_data" and then run a container using this volume and from the image portainer/portainer :

```
docker volume create portainer_data
$ docker run -d -p 9000:9000 --name portainer -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer
```

Then we can access the UI with a browser by typing 192.168.99.100:9000

## Step 7 : 

First we need to install 2 modules in the apache-reverse-proxy container. We simply add the following lines to the Dockerfile before rebuilding the container :
```
RUN a2enmod proxy proxy_http
RUN a2enmod proxy_balancer status lbmethod_byrequests
```
