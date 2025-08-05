FROM docker.elastic.co/kibana/kibana:8.11.0

USER root

RUN apt-get update && apt-get install -y gosu wget ca-certificates gpg build-essential curl git \
    && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh &&\
	chown -R 1000:1000 /usr/share/ &&\
	chmod -R 775 /usr/share/

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

EXPOSE 5601
