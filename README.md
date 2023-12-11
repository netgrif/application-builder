# Netgrif Application Builder

[![License](https://img.shields.io/badge/license-NETGRIF%20Community%20License-green)](https://netgrif.com/license)
[![Angular dependency](https://img.shields.io/github/package-json/dependency-version/netgrif/application-builder/@angular/core?color=red)](https://www.angular.io/))
[![Petriflow 1.0.1](https://img.shields.io/badge/Petriflow-1.0.1-0aa8ff)](https://petriflow.com)
[![Docker Pulls](https://img.shields.io/docker/pulls/netgrif/application-builder)](https://hub.docker.com/r/netgrif/application-builder)
[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/netgrif/application-builder?display_name=tag&sort=semver)](https://github.com/netgrif/application-builder/releases)
[![build](https://github.com/netgrif/application-builder/actions/workflows/master-build.yml/badge.svg)](https://github.com/netgrif/application-builder/actions/workflows/master-build.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=netgrif_application-builder&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=netgrif_application-builder)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=netgrif_application-builder&metric=coverage)](https://sonarcloud.io/dashboard?id=netgrif_application-builder)
[![Known Vulnerabilities](https://snyk.io/test/github/netgrif/application-builder/badge.svg)](https://snyk.io/test/github/netgrif/application-builder)

Netgrif Application Builder is an angular web application for implementing process-driven application in low-code language Petriflow.
Petriflow processes can be run/interpreted in Netgrif Application Engine.

Live build: [https://builder.netgrif.com](https://builder.netgrif.com)

Application Builder consists of several modules that helps with development of business processes, application's dataset, permission schema, and many more.
Builder can be deployed as is directly from the release artifact or as a docker container. It doesn't save your work on any server. It works only in a browser.

* Petriflow low-code language: [http://petriflow.com](https://petriflow.com)
* Netgrif Application Engine: [NAE repozitory](https://github.com/netgrif/application-engine), [NAE documentation](https://engine.netgrif.com)
* Issue Tracker: [GitHub issues](https://github.com/netgrif/application-builder/issues)
* License: [NETGRIF Community License](https://github.com/netgrif/application-builder/blob/master/LICENSE)

## Usage

Builder is single-page application (SPA) implemented in Angular. You can deploy it as normal web page on any website hosting. You can use a [release artifact](https://github.com/netgrif/application-builder/releases/tag/v6.3.2) 
to deploy the zip archive. The application is also published to [DockerHub](https://hub.docker.com/r/netgrif/application-builder) for container deployment.
For running the application no further configuration is needed.

## Installation

For local installation of the application you can clone the repository and then simply run it with Angular CLI.
To run the application from the repository Node.js v18+ is recommended.

```shell
npm i --legacy-peer-deps
npm run start
```

## Other projects

### Application Engine

[Netgrif Application Engine](https://github.com/netgrif/application-engine) is workflow management system powered by low-code language Petriflow written in Java.
Application Engine can run as a standalone java application, as a docker image, or you can embed it to your Java/Spring Boot project.

### Components

[Netgrif Components](https://github.com/netgrif/components) is an Angular library for creating SPA (Single-page application) compatible with Netgrif Application Engine. 
The library provides all necessary tools for creating refined frontend application into NAE environment, 
and to create own library of Angular web components to incorporate your own personal design to the platform.

## Reporting issues

If you find a bug, let us know at [Issue page](https://github.com/netgrif/application-builder/issues). First, please read our [Contribution guide](https://github.com/netgrif/application-builder/blob/master/CONTRIBUTING.md)

## License

The software is licensed under NETGRIF Community license. You may be found this license at [the LICENSE file](https://github.com/netgrif/application-builder/blob/master/LICENSE) in the repository.
