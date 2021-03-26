# -*- coding:utf-8 -*-

import mysql.connector
import datetime


class face_mysql:
    def __init__(self):
        pass

    # 设置数据库和密码
    def conn_mysql(self):
        db = mysql.connector.connect(user='cloudliter', password='CloudLight2,', host='localhost', database='hichat',
                                     port=3306)
        return db

    def insert_facejson(self, pic_name, pic_json, userId):
        db = self.conn_mysql()
        cursor = db.cursor()
        try:
            sql = "insert into faces(json,state,pic_name,userId) values('%s' ,'%d','%s','%s') ;" % (
                pic_json, 1, pic_name, userId)
            # print("sql=",sql)
            lastid = 0

            # 执行sql语句
            cursor.execute(sql)
            # 提交到数据库执行
            lastid = int(cursor.lastrowid)
            db.commit()
        except Exception as e:
            print(e)
            # Rollback in case there is any error
            db.rollback()
        db.close()
        return lastid

    def findall_facejson(self, userId):
        db = self.conn_mysql()
        cursor = db.cursor()

        sql = "select * from faces where (userId = '%s' or userId in (select friendId from relation as r,whitelist as w where w.userId = r.friendId and w.whiteId = r.userId and r.userId = '%s' ));" % (userId,userId)
        try:
            cursor.execute(sql)
            results = cursor.fetchall()
            return results
        except:
            print("Error:unable to fecth data")
        db.close()
