#Teaching-HEIGVD-RES-2018-Labo-HTTPInfra

Authors : Labinot Rashiti & Romain Gallay

##Introduction

During the RES training in HEIG-VD, we have to do a big lab that is called HTTPInfra. It summaries the whole knowledge that we had in the semester for this course.

This lab is to get familiar with Javascript, Docker, PHP, bootstrap and npm. All these libraries are used to get a nice HTTP Infrastucture. 

## Step 1 : Static HTTP server with apache httpd

By looking the webcast, first step of the lab is in the fb-apache-static branch. This step is to make an apache HTTP server in a Docker container and run a static HTML website in it.

Firstly we downloaded an Apache server that contains already a PHP version. After this, we took a template in the Boostrap official website like told in the webcast. Theses templates are ready to use so we just copy the content folder in the right image folder.

To make a docker container, we need a Dockerfile which will look like this :

```
FROM php:7.0-apache

COPY content/ /var/www/html/
```

It means that we will copy the Boostrap website "content" in the default folder for web content. After this, we can already test our work by typing these commands in a docker terminal :

````docker build -t res/apache_php . 
docker build -t res/apache_php . 
docker run -p 9090:80 res/apache_php
````

First line, we create the container, second line we run it and make a port correspondence with our local port 9090 and the 80 port of the dockerized apache server. Then we just have to look at the IP 192.168.99.100:9090 to see the website.

## Step 2: Dynamic HTTP server with express.js

This second refers to the branch fb-express-dynamic as seen in the webcast. In this step, we will have to write an API that will return randomly Json data with Node.js. 

To make this little script, we used the npm libraries chance (gives random numbers) and express (help us to make network request easily). Our script will return addresses and not students. You have the code in the git repo to check this out.

This little application has to be dockerized so like every container and Docker image,  we make his Dockerfile :

``` 
FROM node:4.4
COPY src /opt/app
CMD["node", "opt/app/index.js"]
```

The Dockerfile isn't too big, it simply copy the script in the src folder and run it from the container with the CMD command. It is important not to forget to init the module with npm. Because the script use external libraries, we have to be warned about dependancy problems...

That's why we have to do a quick "npm init" to create the package.json and then a "npm install --save chance express" to install chance and express libraries. Don't forget, this has to be before the creation of the Docker image.

After that, we can use the script as a docker container. We had to execute these commands like said in the webcast :

```
docker build -t res/express_addresses
docker run -p 9091:3000 res/express_addresses
```

You can check the result in 192.168.99.100:9091 to get addresses lists.

## Step 3: Reverse proxy with apache (static configuration)

This part of the lab is repertoried in the fb-apache-reverse-proxy branch.

In this part, we will have to add a proxy in our HTTP infrastructure. It means that we want only one entry point to access multiple content of our infrastructure. For example, we can access to the static website or the little application that give addresses.

By chance, Apache2 has a proxy module that is given. This module contains the file 000-default. We copied this file in a new name 001-reverse-proxy.conf and it contains this content :

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

This configuration will map the entry "/" to the static website and the entry "/api/addresses/" to the little API that we just coded in Javascript.

Be careful, this file contains hard coded IP. It's not a good idea because Docker gives random IPs. Maybe your static website IP or API IP will not match with this file so it won't work. This problem will be fixed in the next step. For the moment, in the webcast, we just test this.

````
FROM php:5.6-apache

COPY conf/ /etc/apache2

RUN a2enmod proxy proxy_http
RUN a2ensite 000-* 001-*
````

Don't forget this Dockerfile to get create our first proxy Apache server. Theses commands are here to copy the current conf (wich contains the 001-reverse-proxy.conf) into the Apache container and enable the proxy mode with the RUN command. 

By the way, for the next tests, you have to configure your host file to redirect the name demo.res.ch to 192.168.99.100. It will be simpler to test this.

For the test, you have to be very careful. We have static IP in our 001-reverse-proxy.conf so we must do things to have exactly the same IP range for the containers. First be sure not to have any container running and then do theses commands :a

```
docker build -t res/apache_php ./apache-php-image/
docker build -t res/express_students ./express-image/
docker build -t res/apache_rp ./apache-reverse-proxy/

docker run -d res/apache_php 
docker run -d res/express_students 
docker run -p 8080:80 res/apache_rp
```

The three first commands create the Docker Images. The three last commands create the containers. Normally the first container should have the 172.17.0.2 IP and the second 172.17.0.3 IP.

To check if the HTTP infrastructure you have to go to : 

- demo.res.ch:8080 for the static website
- demo.res.ch:8080/api/addresses for the API (don't forget the / in the end)

## Step 4: AJAX requests with JQuery

This step is on the branch fb-ajax-query. 

First thing we changed in every Dockerfile is to update the software catalog and install vim. By default, containers don't have vim installed and it is very useful to edit configuration files.

```
RUN apt-get update && \
	apt-get install -y vim
```

Now, we want to add the dynamic app in our website. To do this, we have to edit the index.html file in the website content and add this line in the script part of the website :

```
	<!-- My RES Script -->
	<script src="vendor/jquery/addresses.js"></script>
```

Our website template scripts are in the "jquery" folder so don't forget to paste the script in the folder.

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

This script will load some adresses every 2 seconds and show them in a HTML element wich has a "skills" CSS class. This means that we have to add the "skills" class in an HTML element in the website template. We chose to add it in the nav bar to see it more clearly.

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

This step is on branch fb-dynamic-configuration by looking the webcast.

This is the step where we will remove theses hard coded IPs and make an better implementation of our HTTPInfra. The goal here is to give the IPs for the container Apache_rp with the '-e' option with the right IP.

To do this, we used an file called apache2-foreground taken from this repo :

````
https://github.com/docker-library/php/blob/master/7.0/stretch/apache/apache2-foreground
````

This file must be in /usr/local/bin from the Apache_rp container so just add the line "COPY apache2-foreground /usr/local/bin/" in the apache-reverse-proxy Dockerfile.

Then create this file called config-template.php :

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

Now we can test it ! Create some containers to diversify the IP address range. Create and name one apache_php container, one express_dynamic container. Look at their IP address with the command :

````
docker inspect DockerNameID | grep -i ipaddress
````

Then use their IPs to launch the Apache reverse with the command : 

````
docker run -d -p 8080:80 -e STATIC_APP=IPOfApache_php:80 -e DYNAMIC_APP=IPOfExpress_dynamic:3000  --name apache_rp res/apache_rp
````

And it is done !